/**
 * Moteur de quêtes.
 *
 * Fait avancer les quêtes selon les événements d'une séance et détecte les
 * quêtes complétées (donnant XP, badges, titres). Fonctions pures.
 */

import type {
  MuscleGroup,
  QuestDefinition,
  UserQuest,
} from '@/models';

/** Résumé d'une séance terminée, servant à faire progresser les quêtes. */
export interface WorkoutSummary {
  completed: boolean;
  setsCount: number;
  brokeRecord: boolean;
  musclesTrained: MuscleGroup[];
  skippedAnyExercise: boolean;
  totalVolume: number;
}

/** Contexte hebdomadaire agrégé. */
export interface WeeklyContext {
  workoutsThisWeek: number;
  totalSetsThisWeek: number;
  volumeThisWeek: number;
  volumeLastWeek: number;
  restDaysThisWeek: number;
  plannedMuscles: MuscleGroup[];
  musclesTrainedThisWeek: MuscleGroup[];
}

/** Clé de période quotidienne : AAAA-MM-JJ. */
export function dailyPeriodKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Clé de période hebdomadaire : AAAA-Www (ISO). */
export function weeklyPeriodKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Calcule la nouvelle progression d'une quête quotidienne à partir d'un résumé
 * de séance. Retourne la progression absolue (à additionner par le store).
 */
export function dailyQuestDelta(
  def: QuestDefinition,
  summary: WorkoutSummary,
): number {
  switch (def.metric) {
    case 'complete_workout':
      return summary.completed ? 1 : 0;
    case 'sets_count':
      return summary.setsCount;
    case 'beat_record':
      return summary.brokeRecord ? 1 : 0;
    case 'train_muscle':
      return def.muscle && summary.musclesTrained.includes(def.muscle) ? 1 : 0;
    case 'no_skip_workout':
      return summary.completed && !summary.skippedAnyExercise ? 1 : 0;
    default:
      return 0;
  }
}

/**
 * Évalue la progression absolue d'une quête hebdomadaire à partir du contexte
 * agrégé de la semaine (progression = valeur, non un delta).
 */
export function weeklyQuestProgress(
  def: QuestDefinition,
  ctx: WeeklyContext,
): number {
  switch (def.metric) {
    case 'workouts_count':
      return ctx.workoutsThisWeek;
    case 'total_sets':
      return ctx.totalSetsThisWeek;
    case 'rest_days':
      return ctx.restDaysThisWeek;
    case 'volume_increase': {
      if (ctx.volumeLastWeek <= 0) return 0;
      const pct = ((ctx.volumeThisWeek - ctx.volumeLastWeek) / ctx.volumeLastWeek) * 100;
      return Math.max(0, Math.round(pct));
    }
    case 'train_all_muscles': {
      if (ctx.plannedMuscles.length === 0) return 0;
      const all = ctx.plannedMuscles.every((m) => ctx.musclesTrainedThisWeek.includes(m));
      return all ? 1 : 0;
    }
    default:
      return 0;
  }
}

/** Applique une progression à une quête utilisateur (immuable). */
export function applyProgress(
  quest: UserQuest,
  newProgress: number,
  mode: 'add' | 'set',
): UserQuest {
  const progress =
    mode === 'add' ? quest.progress + newProgress : Math.max(quest.progress, newProgress);
  const clamped = Math.min(progress, quest.target);
  return {
    ...quest,
    progress: clamped,
    completed: clamped >= quest.target,
  };
}
