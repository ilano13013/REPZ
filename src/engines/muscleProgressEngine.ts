/**
 * Moteur de progression musculaire.
 *
 * Répartit l'XP d'un exercice entre son groupe principal et ses groupes
 * secondaires selon `muscleSplit`, et convertit l'XP musculaire en niveau.
 */

import type { Exercise, MuscleGroup, MuscleSplit } from '@/models';

/** XP nécessaire pour passer au niveau musculaire suivant (courbe douce). */
export function xpForMuscleLevel(level: number): number {
  return Math.round(80 * Math.pow(level, 1.4));
}

/** Résout le niveau musculaire à partir de l'XP cumulée. */
export function resolveMuscleLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
} {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  // Garde-fou : plafond à 100 pour les niveaux musculaires.
  while (level < 100) {
    const need = xpForMuscleLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level += 1;
  }
  const xpForNext = xpForMuscleLevel(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpForNext,
    progress: Math.min(1, remaining / xpForNext),
  };
}

/**
 * Normalise une répartition musculaire pour que la somme vaille 1.
 * Si vide, attribue 100 % au muscle principal.
 */
export function normalizeSplit(exercise: Exercise): MuscleSplit {
  const entries = Object.entries(exercise.muscleSplit) as [MuscleGroup, number][];
  if (entries.length === 0) {
    return { [exercise.primaryMuscle]: 1 } as MuscleSplit;
  }
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  if (total <= 0) return { [exercise.primaryMuscle]: 1 } as MuscleSplit;
  const normalized: MuscleSplit = {};
  for (const [muscle, v] of entries) {
    normalized[muscle] = v / total;
  }
  return normalized;
}

/**
 * Distribue un montant d'XP sur les groupes musculaires d'un exercice.
 * Retourne une map muscle → XP (entiers, jamais négatifs).
 */
export function distributeXpToMuscles(
  exercise: Exercise,
  xp: number,
): Partial<Record<MuscleGroup, number>> {
  const split = normalizeSplit(exercise);
  const result: Partial<Record<MuscleGroup, number>> = {};
  for (const [muscle, fraction] of Object.entries(split) as [MuscleGroup, number][]) {
    const value = Math.round(Math.max(0, xp) * fraction);
    if (value > 0) result[muscle] = value;
  }
  return result;
}
