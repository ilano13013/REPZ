/**
 * Définitions des quêtes quotidiennes et hebdomadaires.
 * Fichier de configuration : ajuster librement cibles et récompenses.
 */

import type { QuestDefinition } from '@/models';

export const DAILY_QUESTS: QuestDefinition[] = [
  {
    id: 'daily_complete_workout',
    period: 'daily',
    title: 'Séance du jour',
    description: 'Terminer une séance aujourd\'hui.',
    metric: 'complete_workout',
    target: 1,
    rewardXp: 80,
  },
  {
    id: 'daily_10_sets',
    period: 'daily',
    title: 'Volume de travail',
    description: 'Réaliser 10 séries.',
    metric: 'sets_count',
    target: 10,
    rewardXp: 60,
  },
  {
    id: 'daily_beat_record',
    period: 'daily',
    title: 'Repousse tes limites',
    description: 'Battre un record personnel.',
    metric: 'beat_record',
    target: 1,
    rewardXp: 100,
    rewardBadgeId: 'record_breaker',
  },
  {
    id: 'daily_train_chest',
    period: 'daily',
    title: 'Focus pectoraux',
    description: 'Entraîner les pectoraux.',
    metric: 'train_muscle',
    muscle: 'chest',
    target: 1,
    rewardXp: 50,
  },
  {
    id: 'daily_no_skip',
    period: 'daily',
    title: 'Discipline',
    description: 'Terminer une séance sans passer d\'exercice.',
    metric: 'no_skip_workout',
    target: 1,
    rewardXp: 70,
  },
];

export const WEEKLY_QUESTS: QuestDefinition[] = [
  {
    id: 'weekly_3_workouts',
    period: 'weekly',
    title: 'Régularité',
    description: 'Terminer trois entraînements cette semaine.',
    metric: 'workouts_count',
    target: 3,
    rewardXp: 250,
    rewardBadgeId: 'consistent',
  },
  {
    id: 'weekly_volume_increase',
    period: 'weekly',
    title: 'Progression',
    description: 'Augmenter le volume total de 5 % vs la semaine dernière.',
    metric: 'volume_increase',
    target: 5,
    rewardXp: 200,
  },
  {
    id: 'weekly_all_muscles',
    period: 'weekly',
    title: 'Corps complet',
    description: 'Entraîner tous les groupes prévus.',
    metric: 'train_all_muscles',
    target: 1,
    rewardXp: 220,
  },
  {
    id: 'weekly_rest_days',
    period: 'weekly',
    title: 'Récupération',
    description: 'Respecter deux jours de récupération.',
    metric: 'rest_days',
    target: 2,
    rewardXp: 120,
  },
  {
    id: 'weekly_50_sets',
    period: 'weekly',
    title: 'Machine de guerre',
    description: 'Réaliser 50 séries dans la semaine.',
    metric: 'total_sets',
    target: 50,
    rewardXp: 300,
    rewardBadgeId: 'grinder',
  },
];

export const ALL_QUESTS: QuestDefinition[] = [...DAILY_QUESTS, ...WEEKLY_QUESTS];

export const QUESTS_BY_ID: Record<string, QuestDefinition> = Object.fromEntries(
  ALL_QUESTS.map((q) => [q.id, q]),
);
