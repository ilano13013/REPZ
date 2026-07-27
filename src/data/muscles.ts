/**
 * Métadonnées des groupes musculaires (libellés FR, ordre d'affichage, couleur).
 */

import type { MuscleGroup } from '@/models';

export interface MuscleMeta {
  key: MuscleGroup;
  label: string;
  short: string;
  order: number;
  emoji: string;
}

export const MUSCLES: Record<MuscleGroup, MuscleMeta> = {
  chest: { key: 'chest', label: 'Pectoraux', short: 'Pecs', order: 1, emoji: '🫀' },
  back: { key: 'back', label: 'Dos', short: 'Dos', order: 2, emoji: '🔙' },
  shoulders: { key: 'shoulders', label: 'Épaules', short: 'Épaules', order: 3, emoji: '💪' },
  biceps: { key: 'biceps', label: 'Biceps', short: 'Biceps', order: 4, emoji: '💪' },
  triceps: { key: 'triceps', label: 'Triceps', short: 'Triceps', order: 5, emoji: '💪' },
  abs: { key: 'abs', label: 'Abdominaux', short: 'Abdos', order: 6, emoji: '🧱' },
  quads: { key: 'quads', label: 'Quadriceps', short: 'Quads', order: 7, emoji: '🦵' },
  hamstrings: { key: 'hamstrings', label: 'Ischio-jambiers', short: 'Ischios', order: 8, emoji: '🦵' },
  glutes: { key: 'glutes', label: 'Fessiers', short: 'Fessiers', order: 9, emoji: '🍑' },
  calves: { key: 'calves', label: 'Mollets', short: 'Mollets', order: 10, emoji: '🦵' },
  cardio: { key: 'cardio', label: 'Cardio', short: 'Cardio', order: 11, emoji: '❤️' },
};

export const MUSCLE_ORDER: MuscleGroup[] = Object.values(MUSCLES)
  .sort((a, b) => a.order - b.order)
  .map((m) => m.key);
