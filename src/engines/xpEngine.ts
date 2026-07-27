/**
 * Moteur d'XP — cœur du gameplay.
 *
 * Fonction pure et testable qui calcule l'XP d'une série selon son type, en
 * appliquant progression, records, régularité, adhérence au programme, RPE,
 * puis les plafonds et l'anti-abus.
 *
 * Règles de base :
 *   volume  = charge × répétitions
 *   xpBase  = √volume × coefficientExercice × coefficientDifficulté
 *   bodyweight : chargeEffective = poidsUtilisateur × coefficientPoidsCorps
 *   duration   : xpBase = (secondes / 10) × coefficient
 *
 * L'utilisateur ne perd JAMAIS d'XP : tous les résultats sont ≥ 0.
 */

import type { Exercise, ExerciseType, Difficulty } from '@/models';
import {
  XP_CONFIG,
  BODYWEIGHT_COEFFICIENTS,
  DEFAULT_BODYWEIGHT_COEFFICIENT,
} from '@/constants/xpConfig';

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.9,
  medium: 1.0,
  hard: 1.15,
};

/** Données d'une série à évaluer. */
export interface SetInput {
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
  rpe?: number | null;
}

/** Contexte de calcul (état de l'utilisateur & de la séance). */
export interface XpContext {
  /** Poids de corps de l'utilisateur (kg), requis pour les exercices bodyweight. */
  userBodyweightKg: number;
  /** Meilleur volume historique de cette série pour cet exercice (progression). */
  previousBestVolume?: number | null;
  /** Volume de la même série lors de la dernière séance (progression fine). */
  lastSessionVolume?: number | null;
  /** La série constitue-t-elle un nouveau record personnel ? */
  isPersonalRecord?: boolean;
  /** Index (0-based) de la série pour cet exercice dans la séance (anti-farm). */
  setIndexInExercise?: number;
  /** Première série de la journée ? */
  isFirstSetOfDay?: boolean;
  /** Série de semaines actives de l'utilisateur. */
  weeklyStreak?: number;
  /** La série respecte-t-elle le programme prévu ? */
  followsProgram?: boolean;
  /** XP déjà gagnée aujourd'hui (pour le plafond quotidien souple). */
  dailyXpSoFar?: number;
}

export interface XpBreakdown {
  base: number;
  effectiveLoad: number | null;
  volume: number;
  progressionMultiplier: number;
  rpeMultiplier: number;
  streakMultiplier: number;
  adherenceMultiplier: number;
  firstOfDayBonus: number;
  prFlatBonus: number;
  prMultiplier: number;
  repeatDecay: number;
  /** XP avant application des plafonds. */
  raw: number;
  /** Indique si une valeur irréaliste a été détectée et neutralisée. */
  flaggedUnrealistic: boolean;
  /** Plafonds appliqués (série / quotidien). */
  cappedBySet: boolean;
  cappedByDaily: boolean;
}

export interface XpResult {
  xp: number;
  breakdown: XpBreakdown;
}

// ---------------------------------------------------------------------------
// Calcul de la base par type d'exercice
// ---------------------------------------------------------------------------

interface BaseComputation {
  base: number;
  volume: number;
  effectiveLoad: number | null;
  unrealistic: boolean;
}

function bodyweightCoefficient(exercise: Exercise): number {
  if (exercise.bodyweightKey && exercise.bodyweightKey in BODYWEIGHT_COEFFICIENTS) {
    return BODYWEIGHT_COEFFICIENTS[exercise.bodyweightKey];
  }
  return DEFAULT_BODYWEIGHT_COEFFICIENT;
}

function computeBase(
  type: ExerciseType,
  exercise: Exercise,
  set: SetInput,
  ctx: XpContext,
): BaseComputation {
  const coeff = exercise.xpCoefficient * DIFFICULTY_MULTIPLIER[exercise.difficulty];
  const reps = Math.max(0, set.reps ?? 0);

  switch (type) {
    case 'weight_reps': {
      const load = Math.max(0, set.weightKg ?? 0);
      const unrealistic =
        load > XP_CONFIG.maxPlausibleLoadKg || reps > XP_CONFIG.maxPlausibleReps;
      const volume = load * reps;
      return {
        base: Math.sqrt(volume) * coeff,
        volume,
        effectiveLoad: load,
        unrealistic,
      };
    }
    case 'bodyweight': {
      const effectiveLoad = ctx.userBodyweightKg * bodyweightCoefficient(exercise);
      // Une charge additionnelle (lestage) peut s'ajouter.
      const addedLoad = Math.max(0, set.weightKg ?? 0);
      const totalLoad = effectiveLoad + addedLoad;
      const unrealistic = reps > XP_CONFIG.maxPlausibleReps;
      const volume = totalLoad * reps;
      return {
        base: Math.sqrt(volume) * coeff,
        volume,
        effectiveLoad: totalLoad,
        unrealistic,
      };
    }
    case 'duration': {
      const seconds = Math.max(0, set.durationSec ?? 0);
      // gainage/isométrie : basé sur la durée.
      const unrealistic = seconds > 3600; // > 1h sur une série isométrique = suspect
      return {
        base: (seconds / 10) * coeff,
        volume: seconds,
        effectiveLoad: null,
        unrealistic,
      };
    }
    case 'distance': {
      const meters = Math.max(0, set.distanceM ?? 0);
      const unrealistic = meters > 100_000; // > 100 km
      // 100 m ≈ 1 unité de base.
      return {
        base: (meters / 100) * coeff,
        volume: meters,
        effectiveLoad: null,
        unrealistic,
      };
    }
    case 'cardio': {
      const seconds = Math.max(0, set.durationSec ?? 0);
      const unrealistic = seconds > 4 * 3600;
      return {
        base: (seconds / 60) * coeff * 2,
        volume: seconds,
        effectiveLoad: null,
        unrealistic,
      };
    }
    default:
      return { base: 0, volume: 0, effectiveLoad: null, unrealistic: false };
  }
}

// ---------------------------------------------------------------------------
// Multiplicateurs & bonus
// ---------------------------------------------------------------------------

function progressionMultiplier(volume: number, ctx: XpContext, unrealistic: boolean): number {
  if (unrealistic) return 1;
  const reference = ctx.lastSessionVolume ?? ctx.previousBestVolume ?? null;
  if (!reference || reference <= 0 || volume <= reference) return 1;
  const ratio = volume / reference; // > 1
  // Progression de +5 % à +20 % selon l'ampleur (plafonnée).
  const gain = Math.min(XP_CONFIG.progression.max - 1, (ratio - 1) * 0.5 + 0.05);
  return 1 + Math.max(XP_CONFIG.progression.min - 1, gain);
}

function rpeMultiplier(rpe: number | null | undefined): number {
  if (rpe == null) return 1;
  const clamped = Math.max(1, Math.min(10, rpe));
  const delta = clamped - XP_CONFIG.rpe.neutral;
  return 1 + delta * XP_CONFIG.rpe.perPoint;
}

function streakMultiplier(weeklyStreak: number | undefined): number {
  if (!weeklyStreak || weeklyStreak <= 0) return 1;
  const bonus = Math.min(XP_CONFIG.streakBonusCap, weeklyStreak * XP_CONFIG.streakBonusPerWeek);
  return 1 + bonus;
}

/** Réduction progressive de l'XP au-delà d'un certain nombre de séries répétées. */
function repeatDecay(setIndex: number | undefined): number {
  const idx = setIndex ?? 0;
  const threshold = XP_CONFIG.repeatedExerciseSoftCapAfterSets;
  if (idx < threshold) return 1;
  const over = idx - threshold + 1;
  return Math.pow(XP_CONFIG.repeatedExerciseDecay, over);
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

/**
 * Calcule l'XP d'une série. Applique la base, les multiplicateurs, les bonus,
 * puis les plafonds et l'anti-abus. Le résultat est toujours ≥ 0.
 */
export function computeSetXp(exercise: Exercise, set: SetInput, ctx: XpContext): XpResult {
  const { base, volume, effectiveLoad, unrealistic } = computeBase(
    exercise.type,
    exercise,
    set,
    ctx,
  );

  const progression = progressionMultiplier(volume, ctx, unrealistic);
  const rpe = rpeMultiplier(set.rpe);
  const streak = streakMultiplier(ctx.weeklyStreak);
  const adherence = ctx.followsProgram ? XP_CONFIG.programAdherenceBonus : 1;
  const decay = repeatDecay(ctx.setIndexInExercise);

  // Un record ne compte pas si la valeur est jugée irréaliste.
  const prApplies = !!ctx.isPersonalRecord && !unrealistic;
  const prMultiplier = prApplies ? XP_CONFIG.personalRecord.multiplier : 1;
  const prFlatBonus = prApplies ? XP_CONFIG.personalRecord.flatBonus : 0;
  const firstOfDayBonus = ctx.isFirstSetOfDay ? XP_CONFIG.firstOfDayBonus : 0;

  let raw =
    base * progression * rpe * streak * adherence * decay * prMultiplier +
    prFlatBonus +
    firstOfDayBonus;

  // Anti-abus : volume manifestement excessif vs record → aucune récompense
  // supplémentaire (base plafonnée, bonus neutralisés).
  const previousBest = ctx.previousBestVolume ?? 0;
  const excessive =
    previousBest > 0 && volume > previousBest * XP_CONFIG.unrealisticVolumeMultiplier;
  if (unrealistic || excessive) {
    raw = Math.min(raw, base); // on garde uniquement la base, sans bonus
  }

  // Plafond par série.
  let capped = Math.min(raw, XP_CONFIG.perSetCap);
  const cappedBySet = raw > XP_CONFIG.perSetCap;

  // Plafond quotidien souple.
  let cappedByDaily = false;
  const dailySoFar = ctx.dailyXpSoFar ?? 0;
  if (dailySoFar + capped > XP_CONFIG.softDailyCap) {
    const under = Math.max(0, XP_CONFIG.softDailyCap - dailySoFar);
    const over = capped - under;
    capped = under + over * XP_CONFIG.softDailyDecay;
    cappedByDaily = true;
  }

  const xp = Math.max(0, Math.round(capped));

  return {
    xp,
    breakdown: {
      base: round2(base),
      effectiveLoad: effectiveLoad == null ? null : round2(effectiveLoad),
      volume: round2(volume),
      progressionMultiplier: round2(progression),
      rpeMultiplier: round2(rpe),
      streakMultiplier: round2(streak),
      adherenceMultiplier: round2(adherence),
      firstOfDayBonus,
      prFlatBonus,
      prMultiplier,
      repeatDecay: round2(decay),
      raw: round2(raw),
      flaggedUnrealistic: unrealistic || excessive,
      cappedBySet,
      cappedByDaily,
    },
  };
}

/**
 * Estimation rapide de l'XP d'une série pour l'affichage « gain estimé » avant
 * validation (ignore les plafonds quotidiens et le contexte fin).
 */
export function estimateSetXp(
  exercise: Exercise,
  set: SetInput,
  userBodyweightKg: number,
): number {
  return computeSetXp(exercise, set, { userBodyweightKg }).xp;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
