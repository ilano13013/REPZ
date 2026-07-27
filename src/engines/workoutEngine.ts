/**
 * Moteur de séance : agrégations, boss hebdomadaire et stats de personnage.
 *
 * Regroupe la logique transverse d'une séance qui n'appartient pas
 * spécifiquement à l'XP, aux records ou aux muscles.
 */

import type {
  BossMetric,
  CharacterStats,
  Exercise,
  MuscleGroup,
  SetEntry,
  WeeklyBoss,
  Workout,
} from '@/models';
import { estimateOneRepMax } from './personalRecordEngine';

// ---------------------------------------------------------------------------
// Agrégations de séance
// ---------------------------------------------------------------------------

export function workoutVolume(workout: Workout): number {
  let volume = 0;
  for (const we of workout.exercises) {
    for (const s of we.sets) {
      if (s.completed) volume += (s.weightKg ?? 0) * (s.reps ?? 0);
    }
  }
  return volume;
}

export function workoutCompletedSets(workout: Workout): SetEntry[] {
  return workout.exercises.flatMap((we) => we.sets.filter((s) => s.completed));
}

export function workoutMuscles(
  workout: Workout,
  getExercise: (id: string) => Exercise | undefined,
): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  for (const we of workout.exercises) {
    if (we.skipped) continue;
    const ex = getExercise(we.exerciseId);
    if (!ex) continue;
    const hasCompleted = we.sets.some((s) => s.completed);
    if (!hasCompleted) continue;
    set.add(ex.primaryMuscle);
    ex.secondaryMuscles.forEach((m) => set.add(m));
  }
  return [...set];
}

// ---------------------------------------------------------------------------
// Boss hebdomadaire
// ---------------------------------------------------------------------------

const BOSS_TEMPLATES: { name: string; metric: BossMetric; baseTarget: number }[] = [
  { name: 'Le Colosse', metric: 'total_volume', baseTarget: 25000 },
  { name: 'La Horde', metric: 'total_sets', baseTarget: 60 },
  { name: 'Le Marathonien', metric: 'active_minutes', baseTarget: 180 },
  { name: 'Le Gardien', metric: 'workouts', baseTarget: 4 },
];

/**
 * Génère le boss de la semaine, avec un objectif adapté au niveau et à
 * l'historique de l'utilisateur : difficile mais atteignable.
 *
 * @param weekIndex sert à faire tourner les boss d'une semaine à l'autre.
 * @param recentWeeklyAverage moyenne récente de la métrique (fallback baseTarget).
 */
export function generateWeeklyBoss(params: {
  userId: string;
  weekKey: string;
  weekIndex: number;
  level: number;
  recentWeeklyVolume?: number;
  recentWeeklySets?: number;
  recentWeeklyWorkouts?: number;
  recentWeeklyMinutes?: number;
  startsAt: number;
  endsAt: number;
}): WeeklyBoss {
  const template = BOSS_TEMPLATES[params.weekIndex % BOSS_TEMPLATES.length];

  const recent =
    template.metric === 'total_volume'
      ? params.recentWeeklyVolume
      : template.metric === 'total_sets'
        ? params.recentWeeklySets
        : template.metric === 'workouts'
          ? params.recentWeeklyWorkouts
          : params.recentWeeklyMinutes;

  // Objectif = 110 % de la moyenne récente (défi accessible), borné par un
  // minimum lié au template, avec un léger facteur de niveau.
  const levelFactor = 1 + Math.min(0.5, params.level * 0.01);
  const fromHistory = recent && recent > 0 ? recent * 1.1 : template.baseTarget;
  const target = Math.round(Math.max(template.baseTarget * 0.5, fromHistory) * levelFactor);

  return {
    id: `boss_${params.weekKey}`,
    userId: params.userId,
    weekKey: params.weekKey,
    name: template.name,
    metric: template.metric,
    target,
    progress: 0,
    defeated: false,
    rewardXp: 400 + params.level * 5,
    startsAt: params.startsAt,
    endsAt: params.endsAt,
  };
}

/** Progression du boss (fraction de vie retirée). */
export function bossHealthFraction(boss: WeeklyBoss): number {
  if (boss.target <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - boss.progress / boss.target));
}

// ---------------------------------------------------------------------------
// Statistiques de personnage (fiche RPG)
// ---------------------------------------------------------------------------

export interface StatContributions {
  /** Charges lourdes & records → Force. */
  heavyLoadScore: number;
  /** Nouveaux records → Force/Puissance. */
  recordsBroken: number;
  /** Volume & temps sous tension → Endurance. */
  enduranceVolume: number;
  /** Adhérence programme → Discipline. */
  programAdherence: number; // [0,1]
  /** Semaines complètes → Régularité. */
  completeWeeks: number;
  /** Respect des jours de repos & check-ins → Récupération. */
  recoveryScore: number; // [0,1]
  /** 1RM max estimé / poids de corps → Puissance. */
  relativeStrength: number;
}

/**
 * Met à jour les stats de personnage (0-100) de manière incrémentale et bornée.
 * Les stats ne régressent pas d'elles-mêmes.
 */
export function updateCharacterStats(
  current: CharacterStats,
  c: StatContributions,
): CharacterStats {
  const bump = (value: number, delta: number) => Math.max(0, Math.min(100, value + delta));
  return {
    strength: bump(current.strength, c.heavyLoadScore * 0.5 + c.recordsBroken * 2),
    endurance: bump(current.endurance, Math.sqrt(Math.max(0, c.enduranceVolume)) * 0.05),
    discipline: bump(current.discipline, c.programAdherence * 3),
    power: bump(current.power, c.relativeStrength * 8 + c.recordsBroken * 1.5),
    consistency: bump(current.consistency, c.completeWeeks * 2.5),
    recovery: bump(current.recovery, c.recoveryScore * 3),
  };
}

/** Estime la « Puissance » relative à partir du meilleur 1RM et du poids de corps. */
export function relativeStrengthScore(bestOneRepMax: number, bodyweightKg: number): number {
  if (bodyweightKg <= 0) return 0;
  return bestOneRepMax / bodyweightKg; // ex 1.5 = soulève 1,5× son poids
}

export { estimateOneRepMax };
