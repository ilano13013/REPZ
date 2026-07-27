/**
 * Configuration de la courbe de niveaux et des titres.
 *
 * Fichier de configuration : modifier ici la courbe, les seuils, les titres et
 * les récompenses associées sans toucher au moteur (`levelEngine`).
 */

export const MAX_LEVEL = 100;

/**
 * XP nécessaire pour passer du niveau `level` au suivant.
 * Courbe : 100 × level^1.45 (progression douce puis exigeante).
 */
export function xpForNextLevel(level: number): number {
  if (level < 1) return 0;
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round(100 * Math.pow(level, 1.45));
}

/** Titres débloqués à certains paliers (niveau croissant). */
export interface TitleThreshold {
  level: number;
  title: string;
}

export const TITLES: TitleThreshold[] = [
  { level: 1, title: 'Débutant' },
  { level: 5, title: 'Novice' },
  { level: 10, title: 'Apprenti' },
  { level: 20, title: 'Athlète' },
  { level: 35, title: 'Guerrier' },
  { level: 50, title: 'Titan' },
  { level: 75, title: 'Légende' },
  { level: 100, title: 'Mythique' },
];

/** Récompenses débloquées à un niveau donné (cosmétiques, badges…). */
export interface LevelReward {
  level: number;
  label: string;
  badgeId?: string;
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 5, label: 'Titre « Novice » débloqué' },
  { level: 10, label: 'Thème d\'avatar « Apprenti »', badgeId: 'apprentice' },
  { level: 20, label: 'Titre « Athlète » débloqué' },
  { level: 35, label: 'Cadre d\'avatar « Guerrier »', badgeId: 'warrior' },
  { level: 50, label: 'Titre « Titan » débloqué', badgeId: 'titan' },
  { level: 75, label: 'Effet lumineux « Légende »', badgeId: 'legend' },
  { level: 100, label: 'Titre « Mythique » débloqué', badgeId: 'mythic' },
];
