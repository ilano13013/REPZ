/**
 * Store de jeu : quêtes quotidiennes/hebdomadaires, boss hebdomadaire et ligue.
 * Orchestre `questEngine`, `workoutEngine` (boss) et `leagueEngine`.
 */

import { create } from 'zustand';
import type { LeagueMember, UserQuest, WeeklyBoss, Workout } from '@/models';
import { DAILY_QUESTS, WEEKLY_QUESTS, QUESTS_BY_ID } from '@/data/quests';
import {
  dailyPeriodKey,
  weeklyPeriodKey,
  dailyQuestDelta,
  applyProgress,
  type WorkoutSummary,
} from '@/engines/questEngine';
import { generateWeeklyBoss } from '@/engines/workoutEngine';
import { workoutMuscles } from '@/engines/workoutEngine';
import {
  buildLocalLeaderboard,
  computeLeagueScore,
  divisionForScore,
} from '@/engines/leagueEngine';
import { gameRepo } from '@/db/repositories';
import { getExercise } from '@/data/exercises';
import { uid } from '@/utils/id';
import { startOfWeek, endOfWeek } from '@/utils/date';
import { useProfileStore } from './profileStore';

interface GameState {
  dailyQuests: UserQuest[];
  weeklyQuests: UserQuest[];
  boss: WeeklyBoss | null;
  league: LeagueMember[];

  load: () => Promise<void>;
  ensurePeriods: () => Promise<void>;
  claimQuest: (userQuestId: string) => Promise<number>;
  applyWorkoutCompletion: (workout: Workout) => Promise<number>;
  refreshLeague: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  dailyQuests: [],
  weeklyQuests: [],
  boss: null,
  league: [],

  load: async () => {
    await get().ensurePeriods();
    await get().refreshLeague();
  },

  ensurePeriods: async () => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const now = new Date();
    const dKey = dailyPeriodKey(now);
    const wKey = weeklyPeriodKey(now);

    // Quêtes quotidiennes.
    let daily = await gameRepo.getUserQuests(profile.id, 'daily', dKey);
    if (daily.length === 0) {
      daily = DAILY_QUESTS.map((def) => ({
        id: uid('uq'),
        userId: profile.id,
        questId: def.id,
        period: 'daily' as const,
        periodKey: dKey,
        progress: 0,
        target: def.target,
        completed: false,
        claimed: false,
      }));
      for (const q of daily) await gameRepo.upsertUserQuest(q);
    }

    // Quêtes hebdomadaires.
    let weekly = await gameRepo.getUserQuests(profile.id, 'weekly', wKey);
    if (weekly.length === 0) {
      weekly = WEEKLY_QUESTS.map((def) => ({
        id: uid('uq'),
        userId: profile.id,
        questId: def.id,
        period: 'weekly' as const,
        periodKey: wKey,
        progress: 0,
        target: def.target,
        completed: false,
        claimed: false,
      }));
      for (const q of weekly) await gameRepo.upsertUserQuest(q);
    }

    // Boss de la semaine.
    let boss = await gameRepo.getBoss(profile.id, wKey);
    if (!boss) {
      const weekIndex = Math.floor(startOfWeek(Date.now()) / (7 * 86_400_000));
      boss = generateWeeklyBoss({
        userId: profile.id,
        weekKey: wKey,
        weekIndex,
        level: profile.level,
        recentWeeklyVolume: 20000,
        recentWeeklySets: 45,
        recentWeeklyWorkouts: profile.sessionsPerWeek,
        recentWeeklyMinutes: 150,
        startsAt: startOfWeek(Date.now()),
        endsAt: endOfWeek(Date.now()),
      });
      await gameRepo.upsertBoss(boss);
    }

    set({ dailyQuests: daily, weeklyQuests: weekly, boss });
  },

  claimQuest: async (userQuestId) => {
    const all = [...get().dailyQuests, ...get().weeklyQuests];
    const q = all.find((x) => x.id === userQuestId);
    if (!q || !q.completed || q.claimed) return 0;
    const def = QUESTS_BY_ID[q.questId];
    const reward = def?.rewardXp ?? 0;
    const updated = { ...q, claimed: true };
    await gameRepo.upsertUserQuest(updated);
    if (def?.rewardBadgeId) await useProfileStore.getState().unlockBadge(def.rewardBadgeId);
    if (reward > 0) await useProfileStore.getState().addXp(reward, 'quest', q.questId);

    set({
      dailyQuests: get().dailyQuests.map((x) => (x.id === userQuestId ? updated : x)),
      weeklyQuests: get().weeklyQuests.map((x) => (x.id === userQuestId ? updated : x)),
    });
    return reward;
  },

  applyWorkoutCompletion: async (workout) => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return 0;
    await get().ensurePeriods();

    const muscles = workoutMuscles(workout, getExercise);
    const setsCount = workout.exercises.reduce(
      (acc, we) => acc + we.sets.filter((s) => s.completed).length,
      0,
    );
    const brokeRecord = workout.exercises.some((we) => we.sets.some((s) => s.isPersonalRecord));
    const skipped = workout.exercises.some((we) => we.skipped);

    const summary: WorkoutSummary = {
      completed: true,
      setsCount,
      brokeRecord,
      musclesTrained: muscles,
      skippedAnyExercise: skipped,
      totalVolume: workout.totalVolumeKg,
    };

    // Progression des quêtes quotidiennes.
    const daily = get().dailyQuests.map((q) => {
      const def = QUESTS_BY_ID[q.questId];
      if (!def || q.claimed) return q;
      return applyProgress(q, dailyQuestDelta(def, summary), 'add');
    });
    for (const q of daily) await gameRepo.upsertUserQuest(q);

    // Quêtes hebdomadaires : compteurs simples incrémentés.
    const weekly = get().weeklyQuests.map((q) => {
      const def = QUESTS_BY_ID[q.questId];
      if (!def || q.claimed) return q;
      if (def.metric === 'workouts_count') return applyProgress(q, 1, 'add');
      if (def.metric === 'total_sets') return applyProgress(q, setsCount, 'add');
      return q;
    });
    for (const q of weekly) await gameRepo.upsertUserQuest(q);

    // Progression du boss.
    let boss = get().boss;
    let bossBonus = 0;
    if (boss && !boss.defeated) {
      const delta =
        boss.metric === 'total_volume'
          ? workout.totalVolumeKg
          : boss.metric === 'total_sets'
            ? setsCount
            : boss.metric === 'workouts'
              ? 1
              : Math.round((workout.completedAt! - workout.startedAt) / 60000);
      const progress = boss.progress + delta;
      const defeated = progress >= boss.target;
      boss = { ...boss, progress, defeated };
      await gameRepo.upsertBoss(boss);
      if (defeated) {
        bossBonus = boss.rewardXp;
        await useProfileStore.getState().addXp(boss.rewardXp, 'boss', boss.id);
        await useProfileStore.getState().unlockBadge('boss_slayer');
      }
    }

    set({ dailyQuests: daily, weeklyQuests: weekly, boss });
    await get().refreshLeague();
    return bossBonus;
  },

  refreshLeague: async () => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const completedQuests =
      get().dailyQuests.filter((q) => q.completed).length +
      get().weeklyQuests.filter((q) => q.completed).length;

    const score = computeLeagueScore({
      relativeProgressPct: Math.min(50, profile.level * 2),
      consistency: Math.min(1, profile.currentStreak / 4),
      questsCompleted: completedQuests,
      workoutsCompleted: profile.level, // proxy local
      personalImprovements: 0,
    });
    const league = buildLocalLeaderboard(score, profile.name);
    await gameRepo.replaceLeague(league);
    set({ league });
  },
}));

export { divisionForScore };
