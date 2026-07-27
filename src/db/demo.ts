/**
 * Mode démonstration.
 *
 * Génère un état riche immédiatement explorable : utilisateur niveau ~12,
 * plusieurs séances terminées, records, quêtes partiellement faites, boss en
 * cours, ligue fictive, statistiques et mensurations.
 */

import { getDb, resetDatabase } from './database';
import { profileRepo, workoutRepo, gameRepo, trackingRepo } from './repositories';
import type {
  MuscleGroup,
  PersonalRecord,
  UserProfile,
  Workout,
} from '@/models';
import { EXERCISES } from '@/data/exercises';
import { PROGRAMS } from '@/data/programs';
import { DAILY_QUESTS, WEEKLY_QUESTS } from '@/data/quests';
import { MUSCLE_ORDER } from '@/data/muscles';
import { generateWeeklyBoss } from '@/engines/workoutEngine';
import { buildLocalLeaderboard, computeLeagueScore } from '@/engines/leagueEngine';
import { resolveLevel } from '@/engines/levelEngine';
import { dailyPeriodKey, weeklyPeriodKey } from '@/engines/questEngine';
import { xpForNextLevel } from '@/data/levels';
import { uid } from '@/utils/id';
import { startOfWeek, endOfWeek, DAY_MS } from '@/utils/date';

const DEMO_USER_ID = 'demo_user';

/** XP totale correspondant approximativement au niveau demandé. */
function xpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForNextLevel(l);
  return total + Math.round(xpForNextLevel(level) * 0.4);
}

export async function seedDemo(): Promise<UserProfile> {
  await resetDatabase();
  const now = Date.now();
  const totalXp = xpForLevel(12);
  const level = resolveLevel(totalXp).level;

  const profile: UserProfile = {
    id: DEMO_USER_ID,
    name: 'Alex',
    age: 28,
    sex: 'unspecified',
    heightCm: 178,
    weightKg: 78,
    fitnessLevel: 'intermediate',
    goal: 'muscle_gain',
    sessionsPerWeek: 4,
    availableDays: ['mon', 'tue', 'thu', 'fri'],
    location: 'gym',
    equipment: ['barbell', 'dumbbell', 'bench', 'cable', 'machine', 'pullup_bar'],
    limitations: null,
    units: 'kg',
    createdAt: now - 60 * DAY_MS,
    totalXp,
    level,
    activeProgramId: PROGRAMS.find((p) => p.id === 'upper_lower_4')?.id ?? null,
    currentStreak: 5,
    bestStreak: 7,
    lastWorkoutDate: now - DAY_MS,
  };
  await profileRepo.upsertProfile(profile);
  await profileRepo.upsertSettings({
    userId: DEMO_USER_ID,
    theme: 'dark',
    notificationsEnabled: true,
    units: 'kg',
    privacyShareStats: true,
  });

  // Stats de personnage crédibles pour un niveau 12.
  await profileRepo.upsertCharacterStats(DEMO_USER_ID, {
    strength: 42, endurance: 38, discipline: 55, power: 35, consistency: 60, recovery: 48,
  });

  // Progression musculaire répartie.
  const muscleXp: Record<string, number> = {
    chest: 2200, back: 2600, quads: 2400, hamstrings: 1400, glutes: 1500,
    calves: 700, shoulders: 1800, biceps: 1300, triceps: 1200, abs: 900, cardio: 600,
  };
  for (const muscle of MUSCLE_ORDER) {
    const xp = muscleXp[muscle] ?? 500;
    await profileRepo.upsertMuscleProgress({
      userId: DEMO_USER_ID,
      muscle: muscle as MuscleGroup,
      xp,
      level: 1,
    });
  }

  // Quelques badges.
  for (const b of ['first_workout', 'consistent', 'record_breaker', 'apprentice']) {
    await profileRepo.unlockBadge(DEMO_USER_ID, b);
  }

  // Historique : 8 séances terminées sur les 4 dernières semaines.
  const sampleExercises = ['bench_press', 'back_squat', 'barbell_row', 'overhead_press', 'deadlift'];
  for (let i = 0; i < 8; i++) {
    const startedAt = now - (i * 3 + 1) * DAY_MS;
    const workoutId = uid('w');
    const chosen = sampleExercises.slice(0, 3 + (i % 2));
    const exercises = chosen.map((exId, idx) => {
      const weId = uid('we');
      const baseWeight = { bench_press: 70, back_squat: 100, barbell_row: 60, overhead_press: 45, deadlift: 120 }[exId] ?? 50;
      const w = baseWeight + i; // légère progression dans le temps
      return {
        id: weId,
        workoutId,
        exerciseId: exId,
        order: idx,
        note: null,
        skipped: false,
        sets: Array.from({ length: 3 }, (_, si) => ({
          id: uid('set'),
          workoutExerciseId: weId,
          order: si,
          weightKg: w,
          reps: 8,
          durationSec: null,
          distanceM: null,
          rpe: 8,
          completed: true,
          xpEarned: 30,
          isPersonalRecord: false,
        })),
      };
    });
    const volume = exercises.reduce(
      (acc, e) => acc + e.sets.reduce((a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
      0,
    );
    const workout: Workout = {
      id: workoutId,
      userId: DEMO_USER_ID,
      programId: 'upper_lower_4',
      programDayId: null,
      name: i % 2 === 0 ? 'Haut A' : 'Bas A',
      status: 'completed',
      startedAt,
      completedAt: startedAt + 55 * 60000,
      note: null,
      totalXp: 260,
      totalVolumeKg: volume,
      exercises,
    };
    await workoutRepo.saveWorkout(workout);
  }

  // Records personnels.
  const records: PersonalRecord[] = [
    { id: uid('pr'), userId: DEMO_USER_ID, exerciseId: 'bench_press', type: 'max_load', value: 90, context: null, achievedAt: now - 4 * DAY_MS, workoutId: null },
    { id: uid('pr'), userId: DEMO_USER_ID, exerciseId: 'back_squat', type: 'max_load', value: 130, context: null, achievedAt: now - 7 * DAY_MS, workoutId: null },
    { id: uid('pr'), userId: DEMO_USER_ID, exerciseId: 'deadlift', type: 'best_estimated_1rm', value: 165, context: null, achievedAt: now - 10 * DAY_MS, workoutId: null },
    { id: uid('pr'), userId: DEMO_USER_ID, exerciseId: 'bench_press', type: 'best_set_volume', value: 720, context: null, achievedAt: now - 4 * DAY_MS, workoutId: null },
  ];
  for (const r of records) await workoutRepo.upsertRecord(r);

  // Poids & mensurations sur plusieurs semaines.
  for (let i = 6; i >= 0; i--) {
    await trackingRepo.addBodyWeight({
      id: uid('bw'),
      userId: DEMO_USER_ID,
      weightKg: 80 - i * 0.3,
      date: now - i * 7 * DAY_MS,
    });
  }
  await trackingRepo.addMeasurement({
    id: uid('meas'), userId: DEMO_USER_ID, date: now - 30 * DAY_MS,
    armCm: 37, chestCm: 100, waistCm: 82, hipsCm: 96, thighCm: 58, calfCm: 38, bodyFatPct: 18, photoUri: null,
  });
  await trackingRepo.addMeasurement({
    id: uid('meas'), userId: DEMO_USER_ID, date: now - 2 * DAY_MS,
    armCm: 38.5, chestCm: 102, waistCm: 80, hipsCm: 96, thighCm: 59.5, calfCm: 38.5, bodyFatPct: 16, photoUri: null,
  });

  // Quêtes partiellement complétées.
  const dKey = dailyPeriodKey(new Date());
  const wKey = weeklyPeriodKey(new Date());
  for (let i = 0; i < DAILY_QUESTS.length; i++) {
    const def = DAILY_QUESTS[i];
    const progress = i === 0 ? def.target : Math.floor(def.target * (i === 1 ? 0.6 : 0.2));
    await gameRepo.upsertUserQuest({
      id: uid('uq'), userId: DEMO_USER_ID, questId: def.id, period: 'daily',
      periodKey: dKey, progress, target: def.target, completed: progress >= def.target, claimed: false,
    });
  }
  for (let i = 0; i < WEEKLY_QUESTS.length; i++) {
    const def = WEEKLY_QUESTS[i];
    const progress = Math.floor(def.target * (i % 2 === 0 ? 0.66 : 0.4));
    await gameRepo.upsertUserQuest({
      id: uid('uq'), userId: DEMO_USER_ID, questId: def.id, period: 'weekly',
      periodKey: wKey, progress, target: def.target, completed: false, claimed: false,
    });
  }

  // Boss en cours (à ~60 %).
  const boss = generateWeeklyBoss({
    userId: DEMO_USER_ID, weekKey: wKey, weekIndex: 0, level,
    recentWeeklyVolume: 22000, startsAt: startOfWeek(now), endsAt: endOfWeek(now),
  });
  boss.progress = Math.round(boss.target * 0.6);
  await gameRepo.upsertBoss(boss);

  // Ligue fictive.
  const score = computeLeagueScore({
    relativeProgressPct: 24, consistency: 0.8, questsCompleted: 6,
    workoutsCompleted: 8, personalImprovements: 4,
  });
  await gameRepo.replaceLeague(buildLocalLeaderboard(score, profile.name));

  return profile;
}

export { DEMO_USER_ID };
