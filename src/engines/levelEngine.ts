/**
 * Moteur de niveaux.
 *
 * Convertit une quantité d'XP totale en niveau + progression, calcule les
 * montées de niveau (potentiellement multiples) et résout le titre courant.
 * Fonctions pures — aucune dépendance externe.
 */

import { MAX_LEVEL, xpForNextLevel, TITLES, LEVEL_REWARDS } from '@/data/levels';

export interface LevelState {
  level: number;
  /** XP accumulée à l'intérieur du niveau courant. */
  xpIntoLevel: number;
  /** XP requise pour atteindre le niveau suivant. */
  xpForNext: number;
  /** XP restante avant le prochain niveau. */
  xpRemaining: number;
  /** Fraction de progression [0, 1] dans le niveau courant. */
  progress: number;
  title: string;
}

/**
 * Résout l'état de niveau complet à partir de l'XP totale cumulée.
 * Itère palier par palier ; s'arrête à MAX_LEVEL.
 */
export function resolveLevel(totalXp: number): LevelState {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = xp;

  while (level < MAX_LEVEL) {
    const need = xpForNextLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level += 1;
  }

  const xpForNext = level >= MAX_LEVEL ? 0 : xpForNextLevel(level);
  const progress = xpForNext === 0 ? 1 : remaining / xpForNext;

  return {
    level,
    xpIntoLevel: remaining,
    xpForNext,
    xpRemaining: xpForNext === 0 ? 0 : xpForNext - remaining,
    progress: Math.min(1, progress),
    title: titleForLevel(level),
  };
}

/** Retourne le titre correspondant au niveau (le plus haut palier atteint). */
export function titleForLevel(level: number): string {
  let title = TITLES[0]?.title ?? 'Débutant';
  for (const t of TITLES) {
    if (level >= t.level) title = t.title;
    else break;
  }
  return title;
}

export interface LevelUpResult {
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
  /** Nombre de niveaux gagnés (peut être > 1). */
  levelsGained: number;
  /** Récompenses débloquées sur l'intervalle (fromLevel, toLevel]. */
  rewards: { level: number; label: string; badgeId?: string }[];
  /** Nouveau titre si changement, sinon null. */
  newTitle: string | null;
  before: LevelState;
  after: LevelState;
}

/**
 * Compare l'état de niveau avant/après un gain d'XP et détaille la montée.
 * Gère plusieurs montées de niveau simultanées.
 */
export function computeLevelUp(previousTotalXp: number, gainedXp: number): LevelUpResult {
  const before = resolveLevel(previousTotalXp);
  const after = resolveLevel(previousTotalXp + Math.max(0, gainedXp));
  const leveledUp = after.level > before.level;

  const rewards = leveledUp
    ? LEVEL_REWARDS.filter((r) => r.level > before.level && r.level <= after.level)
    : [];

  const newTitle = leveledUp && after.title !== before.title ? after.title : null;

  return {
    leveledUp,
    fromLevel: before.level,
    toLevel: after.level,
    levelsGained: after.level - before.level,
    rewards,
    newTitle,
    before,
    after,
  };
}
