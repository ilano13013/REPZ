import {
  estimateOneRepMax,
  isOneRepMaxReliable,
  detectSetRecords,
  setRecordCandidates,
} from '../personalRecordEngine';
import type { PersonalRecord } from '@/models';

describe('personalRecordEngine — 1RM (Epley)', () => {
  it('applique 1RM = poids × (1 + reps/30)', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(100 * (1 + 5 / 30), 5);
  });

  it('retourne le poids pour 1 répétition', () => {
    expect(estimateOneRepMax(120, 1)).toBe(120);
  });

  it('marque l\'estimation non fiable au-delà de 12 répétitions', () => {
    expect(isOneRepMaxReliable(10)).toBe(true);
    expect(isOneRepMaxReliable(12)).toBe(true);
    expect(isOneRepMaxReliable(15)).toBe(false);
  });
});

describe('personalRecordEngine — candidats records', () => {
  it('génère les 4 candidats pour une série chargée', () => {
    const c = setRecordCandidates({ weightKg: 100, reps: 5 });
    const types = c.map((x) => x.type);
    expect(types).toContain('max_load');
    expect(types).toContain('max_reps_at_load');
    expect(types).toContain('best_set_volume');
    expect(types).toContain('best_estimated_1rm');
  });
});

describe('personalRecordEngine — détection', () => {
  const existing: PersonalRecord[] = [
    {
      id: '1',
      userId: 'u',
      exerciseId: 'bench_press',
      type: 'max_load',
      value: 90,
      context: null,
      achievedAt: 0,
      workoutId: null,
    },
  ];

  it('détecte un nouveau record de charge', () => {
    const detected = detectSetRecords('bench_press', { weightKg: 100, reps: 3 }, existing);
    const maxLoad = detected.find((d) => d.type === 'max_load');
    expect(maxLoad).toBeDefined();
    expect(maxLoad?.previousValue).toBe(90);
  });

  it('ne détecte pas de record de charge si inférieur', () => {
    const detected = detectSetRecords('bench_press', { weightKg: 85, reps: 3 }, existing);
    const maxLoad = detected.find((d) => d.type === 'max_load');
    expect(maxLoad).toBeUndefined();
  });

  it('considère tout comme record en l\'absence d\'historique', () => {
    const detected = detectSetRecords('squat', { weightKg: 60, reps: 10 }, []);
    expect(detected.length).toBeGreaterThan(0);
  });
});
