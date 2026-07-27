import {
  dailyQuestDelta,
  weeklyQuestProgress,
  applyProgress,
  dailyPeriodKey,
  weeklyPeriodKey,
} from '../questEngine';
import { DAILY_QUESTS, WEEKLY_QUESTS } from '@/data/quests';
import type { MuscleGroup, UserQuest } from '@/models';

const summary = {
  completed: true,
  setsCount: 12,
  brokeRecord: true,
  musclesTrained: ['chest', 'triceps'] as MuscleGroup[],
  skippedAnyExercise: false,
  totalVolume: 5000,
};

describe('questEngine — quêtes quotidiennes', () => {
  it('valide la quête « terminer une séance »', () => {
    const def = DAILY_QUESTS.find((q) => q.metric === 'complete_workout')!;
    expect(dailyQuestDelta(def, { ...summary })).toBe(1);
  });

  it('compte les séries pour « 10 séries »', () => {
    const def = DAILY_QUESTS.find((q) => q.metric === 'sets_count')!;
    expect(dailyQuestDelta(def, { ...summary })).toBe(12);
  });

  it('valide « battre un record »', () => {
    const def = DAILY_QUESTS.find((q) => q.metric === 'beat_record')!;
    expect(dailyQuestDelta(def, { ...summary, brokeRecord: true })).toBe(1);
    expect(dailyQuestDelta(def, { ...summary, brokeRecord: false })).toBe(0);
  });

  it('valide « sans passer d\'exercice » seulement si complet et sans skip', () => {
    const def = DAILY_QUESTS.find((q) => q.metric === 'no_skip_workout')!;
    expect(dailyQuestDelta(def, { ...summary, skippedAnyExercise: false })).toBe(1);
    expect(dailyQuestDelta(def, { ...summary, skippedAnyExercise: true })).toBe(0);
  });
});

describe('questEngine — quêtes hebdomadaires', () => {
  const ctx = {
    workoutsThisWeek: 3,
    totalSetsThisWeek: 55,
    volumeThisWeek: 11000,
    volumeLastWeek: 10000,
    restDaysThisWeek: 2,
    plannedMuscles: ['chest', 'back'] as MuscleGroup[],
    musclesTrainedThisWeek: ['chest', 'back'] as MuscleGroup[],
  };

  it('compte les séances', () => {
    const def = WEEKLY_QUESTS.find((q) => q.metric === 'workouts_count')!;
    expect(weeklyQuestProgress(def, { ...ctx })).toBe(3);
  });

  it('calcule l\'augmentation de volume en %', () => {
    const def = WEEKLY_QUESTS.find((q) => q.metric === 'volume_increase')!;
    expect(weeklyQuestProgress(def, { ...ctx })).toBe(10);
  });

  it('valide « tous les muscles » quand couverts', () => {
    const def = WEEKLY_QUESTS.find((q) => q.metric === 'train_all_muscles')!;
    expect(weeklyQuestProgress(def, { ...ctx })).toBe(1);
    expect(
      weeklyQuestProgress(def, { ...ctx, musclesTrainedThisWeek: ['chest'] as MuscleGroup[] }),
    ).toBe(0);
  });
});

describe('questEngine — application de progression', () => {
  const quest: UserQuest = {
    id: 'uq1',
    userId: 'u',
    questId: 'daily_10_sets',
    period: 'daily',
    periodKey: '2026-07-27',
    progress: 5,
    target: 10,
    completed: false,
    claimed: false,
  };

  it('additionne et complète en atteignant la cible', () => {
    const updated = applyProgress(quest, 6, 'add');
    expect(updated.progress).toBe(10);
    expect(updated.completed).toBe(true);
  });

  it('ne dépasse jamais la cible', () => {
    const updated = applyProgress(quest, 100, 'add');
    expect(updated.progress).toBe(10);
  });

  it('mode set prend le max', () => {
    expect(applyProgress(quest, 3, 'set').progress).toBe(5);
    expect(applyProgress(quest, 8, 'set').progress).toBe(8);
  });
});

describe('questEngine — clés de période', () => {
  it('génère une clé quotidienne AAAA-MM-JJ', () => {
    expect(dailyPeriodKey(new Date('2026-07-27T10:00:00Z'))).toBe('2026-07-27');
  });

  it('génère une clé hebdomadaire ISO', () => {
    expect(weeklyPeriodKey(new Date('2026-07-27T10:00:00Z'))).toMatch(/^2026-W\d{2}$/);
  });
});
