/**
 * Constantes de configuration globales (non liées au gameplay).
 * Les paramètres de gameplay ajustables (courbe d'XP, titres, plafonds) vivent
 * dans `src/data/levels.ts` et `src/constants/xpConfig.ts`.
 */

export const APP_NAME = 'REPZ';
export const DB_NAME = 'repz.db';
export const DB_VERSION = 1;

/** Clés AsyncStorage. */
export const STORAGE_KEYS = {
  theme: 'repz.theme',
  onboardingComplete: 'repz.onboardingComplete',
  demoMode: 'repz.demoMode',
} as const;

/**
 * Drapeaux de fonctionnalités. Les fonctions sociales/cloud sont préparées dans
 * l'architecture mais désactivées dans cette première version.
 */
export const FEATURE_FLAGS = {
  auth: false,
  cloudSync: false,
  friendsLeaderboard: false,
  communityChallenges: false,
  multiDeviceSync: false,
} as const;
