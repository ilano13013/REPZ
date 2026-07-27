import {
  workoutVolume,
  generateWeeklyBoss,
  bossHealthFraction,
  updateCharacterStats,
} from '../workoutEngine';
import type { CharacterStats, Workout } from '@/models';

function makeWorkout(sets: { weightKg: number; reps: number; completed: boolean }[]): Workout {
  return {
    id: 'w1',
    userId: 'u',
    programId: null,
    programDayId: null,
    name: 'Test',
    status: 'completed',
    startedAt: 0,
    completedAt: 1,
    note: null,
    totalXp: 0,
    totalVolumeKg: 0,
    exercises: [
      {
        id: 'we1',
        workoutId: 'w1',
        exerciseId: 'bench_press',
        order: 0,
        note: null,
        skipped: false,
        sets: sets.map((s, i) => ({
          id: `s${i}`,
          workoutExerciseId: 'we1',
          order: i,
          weightKg: s.weightKg,
          reps: s.reps,
          durationSec: null,
          distanceM: null,
          rpe: null,
          completed: s.completed,
          xpEarned: 0,
          isPersonalRecord: false,
        })),
      },
    ],
  };
}

describe('workoutEngine — volume', () => {
  it('somme uniquement les séries validées', () => {
    const w = makeWorkout([
      { weightKg: 80, reps: 8, completed: true },
      { weightKg: 80, reps: 8, completed: false },
    ]);
    expect(workoutVolume(w)).toBe(640);
  });

  it('gère une séance vide', () => {
    const w = makeWorkout([]);
    expect(workoutVolume(w)).toBe(0);
  });

  it('gère une très longue séance sans planter', () => {
    const many = Array.from({ length: 500 }, () => ({
      weightKg: 60,
      reps: 10,
      completed: true,
    }));
    const w = makeWorkout(many);
    expect(workoutVolume(w)).toBe(500 * 600);
  });
});

describe('workoutEngine — boss hebdomadaire', () => {
  it('génère un objectif adapté à l\'historique', () => {
    const boss = generateWeeklyBoss({
      userId: 'u',
      weekKey: '2026-W30',
      weekIndex: 0,
      level: 12,
      recentWeeklyVolume: 20000,
      startsAt: 0,
      endsAt: 100,
    });
    expect(boss.metric).toBe('total_volume');
    // 20000 * 1.1 * (1 + 0.12) ≈ 24640
    expect(boss.target).toBeGreaterThan(20000);
    expect(boss.defeated).toBe(false);
  });

  it('calcule la fraction de vie du boss', () => {
    const boss = generateWeeklyBoss({
      userId: 'u',
      weekKey: '2026-W30',
      weekIndex: 0,
      level: 1,
      recentWeeklyVolume: 10000,
      startsAt: 0,
      endsAt: 100,
    });
    boss.progress = boss.target / 2;
    expect(bossHealthFraction(boss)).toBeCloseTo(0.5, 1);
  });
});

describe('workoutEngine — stats de personnage', () => {
  const base: CharacterStats = {
    strength: 10,
    endurance: 10,
    discipline: 10,
    power: 10,
    consistency: 10,
    recovery: 10,
  };

  it('augmente les stats sans dépasser 100', () => {
    const updated = updateCharacterStats(base, {
      heavyLoadScore: 200,
      recordsBroken: 100,
      enduranceVolume: 1_000_000,
      programAdherence: 1,
      completeWeeks: 100,
      recoveryScore: 1,
      relativeStrength: 2,
    });
    Object.values(updated).forEach((v) => {
      expect(v).toBeLessThanOrEqual(100);
      expect(v).toBeGreaterThanOrEqual(10);
    });
  });
});
