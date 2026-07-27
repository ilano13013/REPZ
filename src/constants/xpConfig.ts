/**
 * Configuration du moteur d'XP.
 *
 * Fichier centralisé et facilement modifiable : tous les coefficients, bonus et
 * plafonds du calcul d'XP sont ici pour permettre un équilibrage rapide sans
 * toucher à la logique du moteur (`src/engines/xpEngine.ts`).
 */

export const XP_CONFIG = {
  /** Plafond d'XP pour une seule série. */
  perSetCap: 400,
  /** Plafond d'XP cumulée pour un même exercice sur une séance. */
  perExerciseCap: 1200,
  /**
   * Plafond quotidien « souple » : au-delà, l'XP n'est pas coupée net mais
   * fortement réduite (voir `softDailyDecay`).
   */
  softDailyCap: 3000,
  /** Facteur de réduction appliqué à la part d'XP dépassant le plafond souple. */
  softDailyDecay: 0.15,

  /** Bonus multiplicatif quand la performance progresse vs la dernière fois. */
  progression: {
    min: 1.05,
    max: 1.2,
  },

  /** Récompense d'un nouveau record personnel. */
  personalRecord: {
    flatBonus: 60,
    multiplier: 1.5,
  },

  /** Bonus fixe accordé à la fin d'une séance complète. */
  workoutCompletionBonus: 120,
  /** Bonus pour la première série/séance de la journée. */
  firstOfDayBonus: 40,
  /** Bonus multiplicatif lié à la série de semaines actives (par semaine, plafonné). */
  streakBonusPerWeek: 0.03,
  streakBonusCap: 0.3,
  /** Bonus quand la série respecte le programme prévu. */
  programAdherenceBonus: 1.05,

  /**
   * Détection anti-abus. Une série dont le volume dépasse ce multiple du record
   * historique de l'utilisateur est considérée comme irréaliste : elle est
   * plafonnée et ne génère pas de bonus de progression/PR.
   */
  unrealisticVolumeMultiplier: 3,
  /** Charge maximale plausible (kg) au-delà de laquelle la valeur est suspecte. */
  maxPlausibleLoadKg: 600,
  /** Répétitions maximales plausibles en une série. */
  maxPlausibleReps: 100,

  /**
   * Réduction progressive : à partir de la Nᵉ série d'un même exercice dans une
   * séance, l'XP est multipliée par un facteur décroissant (anti-farm).
   */
  repeatedExerciseSoftCapAfterSets: 6,
  repeatedExerciseDecay: 0.7,

  /** Coefficient RPE : un effort élevé (RPE proche de 10) donne un léger bonus. */
  rpe: {
    /** RPE de référence, neutre (multiplicateur 1). */
    neutral: 8,
    /** Bonus/malus par point de RPE autour du neutre. */
    perPoint: 0.02,
  },
} as const;

/**
 * Coefficients de « charge effective » pour les exercices au poids du corps.
 * chargeEffective = poidsUtilisateur × coeff.
 */
export const BODYWEIGHT_COEFFICIENTS: Record<string, number> = {
  pushup: 0.65,
  pullup: 1.0,
  bodyweight_squat: 0.75,
  dips: 0.9,
  lunge: 0.6,
  chinup: 1.0,
  inverted_row: 0.6,
};

/** Coefficient par défaut pour un exercice au poids du corps non listé. */
export const DEFAULT_BODYWEIGHT_COEFFICIENT = 0.7;
