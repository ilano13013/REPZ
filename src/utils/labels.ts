/** Libellés d'affichage (français) pour les énumérations du domaine. */

import type { Goal, PersonalRecordType } from '@/models';

export const PR_TYPE_LABEL: Record<PersonalRecordType, string> = {
  max_load: 'Charge max',
  max_reps_at_load: 'Reps max',
  best_set_volume: 'Volume série',
  best_workout_volume: 'Volume séance',
  best_estimated_1rm: '1RM estimé',
};

export const GOAL_LABEL: Record<Goal, string> = {
  muscle_gain: 'Prise de masse',
  weight_loss: 'Perte de poids',
  recomposition: 'Recomposition',
  strength: 'Gain de force',
  maintenance: 'Maintien',
  general_fitness: 'Condition physique',
};

export const STAT_LABEL = {
  strength: 'Force',
  endurance: 'Endurance',
  discipline: 'Discipline',
  power: 'Puissance',
  consistency: 'Régularité',
  recovery: 'Récupération',
} as const;
