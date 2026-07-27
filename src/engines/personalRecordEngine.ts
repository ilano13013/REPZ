/**
 * Moteur de records personnels.
 *
 * Détecte les 5 types de records et estime le 1RM (formule d'Epley).
 * Fonctions pures.
 */

import type { PersonalRecord, PersonalRecordType, SetEntry } from '@/models';

/**
 * Estimation du 1RM par la formule d'Epley : 1RM = poids × (1 + reps / 30).
 * Au-delà de 12 répétitions, l'estimation devient moins fiable (voir `reliable`).
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Indique si l'estimation du 1RM est jugée fiable (≤ 12 répétitions). */
export function isOneRepMaxReliable(reps: number): boolean {
  return reps > 0 && reps <= 12;
}

export interface RecordCandidate {
  type: PersonalRecordType;
  value: number;
  context: number | null;
}

/**
 * Calcule les candidats-records pour une série donnée.
 * `context` porte la charge pour `max_reps_at_load`.
 */
export function setRecordCandidates(set: {
  weightKg: number | null;
  reps: number | null;
}): RecordCandidate[] {
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  const candidates: RecordCandidate[] = [];

  if (weight > 0) {
    candidates.push({ type: 'max_load', value: weight, context: null });
  }
  if (weight > 0 && reps > 0) {
    candidates.push({ type: 'max_reps_at_load', value: reps, context: weight });
    candidates.push({ type: 'best_set_volume', value: weight * reps, context: null });
    candidates.push({
      type: 'best_estimated_1rm',
      value: estimateOneRepMax(weight, reps),
      context: null,
    });
  }
  return candidates;
}

export interface DetectedRecord extends RecordCandidate {
  exerciseId: string;
  previousValue: number | null;
}

/**
 * Compare les candidats d'une série aux records existants et retourne les
 * nouveaux records battus.
 *
 * @param existing records existants pour cet exercice.
 */
export function detectSetRecords(
  exerciseId: string,
  set: { weightKg: number | null; reps: number | null },
  existing: PersonalRecord[],
): DetectedRecord[] {
  const candidates = setRecordCandidates(set);
  const detected: DetectedRecord[] = [];

  for (const c of candidates) {
    const prev = existing.find(
      (r) =>
        r.exerciseId === exerciseId &&
        r.type === c.type &&
        // pour max_reps_at_load, le contexte (charge) doit correspondre
        (c.type !== 'max_reps_at_load' || r.context === c.context),
    );
    if (!prev || c.value > prev.value) {
      detected.push({ ...c, exerciseId, previousValue: prev?.value ?? null });
    }
  }
  return detected;
}

/**
 * Détecte le record de volume sur une séance complète.
 */
export function detectWorkoutVolumeRecord(
  workoutVolume: number,
  bestWorkoutVolume: number | null,
): boolean {
  return workoutVolume > (bestWorkoutVolume ?? 0);
}

/** Volume total d'une liste de séries validées. */
export function computeSetsVolume(sets: SetEntry[]): number {
  return sets.reduce((acc, s) => {
    if (!s.completed) return acc;
    return acc + (s.weightKg ?? 0) * (s.reps ?? 0);
  }, 0);
}
