import { computeSetXp, estimateSetXp } from '../xpEngine';
import { XP_CONFIG } from '@/constants/xpConfig';
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

const pushup: Exercise = {
  id: 'pushup',
  name: 'Pompes',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps'],
  type: 'bodyweight',
  equipment: ['bodyweight'],
  instructions: '',
  difficulty: 'easy',
  xpCoefficient: 0.8,
  bodyweightKey: 'pushup',
  muscleSplit: { chest: 0.7, triceps: 0.3 },
  recommended: { sets: 3, reps: '10-25', restSeconds: 60 },
};

const plank: Exercise = {
  id: 'plank',
  name: 'Gainage',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  type: 'duration',
  equipment: ['bodyweight'],
  instructions: '',
  difficulty: 'easy',
  xpCoefficient: 1,
  muscleSplit: { abs: 1 },
  recommended: { sets: 3, reps: '30-60s', restSeconds: 45 },
};

describe('xpEngine — série normale (charge + reps)', () => {
  it('calcule une XP positive et cohérente', () => {
    const { xp, breakdown } = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80 },
    );
    // volume = 640, base = sqrt(640) * 1.2 * 1.0 ≈ 30.4
    expect(breakdown.volume).toBe(640);
    expect(xp).toBeGreaterThan(0);
    expect(xp).toBeLessThan(XP_CONFIG.perSetCap);
  });

  it('donne un bonus de progression quand le volume augmente', () => {
    const withProgress = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80, lastSessionVolume: 500 },
    );
    const noProgress = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80, lastSessionVolume: 640 },
    );
    expect(withProgress.breakdown.progressionMultiplier).toBeGreaterThan(1);
    expect(withProgress.xp).toBeGreaterThan(noProgress.xp);
  });
});

describe('xpEngine — poids du corps', () => {
  it('utilise la charge effective = poids × coefficient', () => {
    const { breakdown, xp } = computeSetXp(
      pushup,
      { reps: 20 },
      { userBodyweightKg: 80 },
    );
    // chargeEffective = 80 * 0.65 = 52
    expect(breakdown.effectiveLoad).toBe(52);
    expect(breakdown.volume).toBe(52 * 20);
    expect(xp).toBeGreaterThan(0);
  });
});

describe('xpEngine — exercice chronométré', () => {
  it('calcule l\'XP à partir de la durée', () => {
    const { xp, breakdown } = computeSetXp(
      plank,
      { durationSec: 60 },
      { userBodyweightKg: 80 },
    );
    // base = (60/10) * coeff ; coeff = 1 (xp) * 0.9 (difficulté easy) = 0.9 → 5.4
    expect(breakdown.base).toBeCloseTo(5.4, 1);
    expect(xp).toBeGreaterThan(0);
  });
});

describe('xpEngine — nouveau record', () => {
  it('applique le bonus fixe et le multiplicateur de PR', () => {
    const normal = computeSetXp(bench, { weightKg: 80, reps: 8 }, { userBodyweightKg: 80 });
    const record = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80, isPersonalRecord: true },
    );
    expect(record.breakdown.prMultiplier).toBe(XP_CONFIG.personalRecord.multiplier);
    expect(record.breakdown.prFlatBonus).toBe(XP_CONFIG.personalRecord.flatBonus);
    expect(record.xp).toBeGreaterThan(normal.xp);
  });
});

describe('xpEngine — anti-abus / valeurs irréalistes', () => {
  it('neutralise les bonus pour une charge irréaliste', () => {
    const { breakdown } = computeSetXp(
      bench,
      { weightKg: 5000, reps: 50 },
      { userBodyweightKg: 80, isPersonalRecord: true, lastSessionVolume: 500 },
    );
    expect(breakdown.flaggedUnrealistic).toBe(true);
    // le PR et la progression ne doivent pas s'appliquer
    expect(breakdown.prFlatBonus).toBe(0);
  });

  it('plafonne l\'XP par série', () => {
    const { xp } = computeSetXp(
      bench,
      { weightKg: 300, reps: 20 },
      { userBodyweightKg: 80 },
    );
    expect(xp).toBeLessThanOrEqual(XP_CONFIG.perSetCap);
  });

  it('applique une réduction quand le volume dépasse largement le record', () => {
    const excessive = computeSetXp(
      bench,
      { weightKg: 200, reps: 10 }, // volume 2000
      { userBodyweightKg: 80, previousBestVolume: 500, isPersonalRecord: true },
    );
    expect(excessive.breakdown.flaggedUnrealistic).toBe(true);
  });

  it('applique le plafond quotidien souple', () => {
    const { xp, breakdown } = computeSetXp(
      bench,
      { weightKg: 100, reps: 10 },
      { userBodyweightKg: 80, dailyXpSoFar: XP_CONFIG.softDailyCap },
    );
    expect(breakdown.cappedByDaily).toBe(true);
    // au-delà du plafond, l'XP est fortement réduite mais jamais négative
    expect(xp).toBeGreaterThanOrEqual(0);
  });

  it('réduit progressivement l\'XP des séries répétées (anti-farm)', () => {
    const early = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80, setIndexInExercise: 0 },
    );
    const late = computeSetXp(
      bench,
      { weightKg: 80, reps: 8 },
      { userBodyweightKg: 80, setIndexInExercise: 10 },
    );
    expect(late.breakdown.repeatDecay).toBeLessThan(1);
    expect(late.xp).toBeLessThan(early.xp);
  });
});

describe('xpEngine — jamais de perte d\'XP', () => {
  it('retourne 0 pour une série vide, jamais négatif', () => {
    const { xp } = computeSetXp(bench, {}, { userBodyweightKg: 80 });
    expect(xp).toBe(0);
    expect(xp).toBeGreaterThanOrEqual(0);
  });
});

describe('xpEngine — estimation rapide', () => {
  it('estimateSetXp retourne une valeur cohérente', () => {
    expect(estimateSetXp(bench, { weightKg: 80, reps: 8 }, 80)).toBeGreaterThan(0);
  });
});
