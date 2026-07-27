/**
 * Définitions des badges.
 */

import type { BadgeDefinition } from '@/models';

export const BADGES: BadgeDefinition[] = [
  { id: 'first_workout', name: 'Premier pas', description: 'Terminer sa première séance.', icon: '🎯', rarity: 'common' },
  { id: 'record_breaker', name: 'Briseur de records', description: 'Battre un record personnel.', icon: '🏆', rarity: 'rare' },
  { id: 'consistent', name: 'Régulier', description: '3 séances dans une semaine.', icon: '📅', rarity: 'rare' },
  { id: 'grinder', name: 'Acharné', description: '50 séries dans une semaine.', icon: '⚙️', rarity: 'epic' },
  { id: 'week_streak_4', name: 'Feu sacré', description: '4 semaines actives consécutives.', icon: '🔥', rarity: 'epic' },
  { id: 'boss_slayer', name: 'Tombeur de boss', description: 'Vaincre un boss hebdomadaire.', icon: '⚔️', rarity: 'epic' },
  { id: 'apprentice', name: 'Apprenti', description: 'Atteindre le niveau 10.', icon: '🥉', rarity: 'rare' },
  { id: 'warrior', name: 'Guerrier', description: 'Atteindre le niveau 35.', icon: '🥈', rarity: 'epic' },
  { id: 'titan', name: 'Titan', description: 'Atteindre le niveau 50.', icon: '🥇', rarity: 'legendary' },
  { id: 'legend', name: 'Légende', description: 'Atteindre le niveau 75.', icon: '🌟', rarity: 'legendary' },
  { id: 'mythic', name: 'Mythique', description: 'Atteindre le niveau 100.', icon: '👑', rarity: 'legendary' },
  { id: 'iron_will', name: 'Volonté de fer', description: 'Ton 1RM estimé dépasse 1,5× ton poids de corps.', icon: '🛡️', rarity: 'epic' },
];

export const BADGES_BY_ID: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);
