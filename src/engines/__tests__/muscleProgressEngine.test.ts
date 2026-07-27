import {
  distributeXpToMuscles,
  resolveMuscleLevel,
  normalizeSplit,
} from '../muscleProgressEngine';
import type { Exercise } from '@/models';

const bench: Exercise = {
  id: 'bench_press',
  name: 'Développé couché',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  type: 'weight_reps',
  equipment: ['barbell'],
  instructions: '',
  difficulty: 'medium',
  xpCoefficient: 1.2,
  muscleSplit: { chest: 0.7, triceps: 0.2, shoulders: 0.1 },
  recommended: { sets: 4, reps: '6-10', restSeconds: 120 },
};

describe('muscleProgressEngine — répartition', () => {
  it('répartit l\'XP selon le split (70/20/10)', () => {
    const dist = distributeXpToMuscles(bench, 100);
    expect(dist.chest).toBe(70);
    expect(dist.triceps).toBe(20);
    expect(dist.shoulders).toBe(10);
  });

  it('la somme distribuée reste proche du total', () => {
    const dist = distributeXpToMuscles(bench, 137);
    const sum = Object.values(dist).reduce((a, b) => a + (b ?? 0), 0);
    expect(Math.abs(sum - 137)).toBeLessThanOrEqual(2);
  });

  it('normalise un split incomplet vers le muscle principal', () => {
    const ex = { ...bench, muscleSplit: {} } as Exercise;
    const split = normalizeSplit(ex);
    expect(split.chest).toBe(1);
  });
});

describe('muscleProgressEngine — niveau musculaire', () => {
  it('démarre au niveau 1', () => {
    expect(resolveMuscleLevel(0).level).toBe(1);
  });

  it('monte de niveau avec l\'XP accumulée', () => {
    const s = resolveMuscleLevel(10000);
    expect(s.level).toBeGreaterThan(1);
    expect(s.progress).toBeGreaterThanOrEqual(0);
    expect(s.progress).toBeLessThanOrEqual(1);
  });
});
