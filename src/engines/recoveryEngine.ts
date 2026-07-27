/**
 * Moteur de récupération & sécurité.
 *
 * À partir du check-in d'avant-séance et de l'historique récent, produit une
 * recommandation et d'éventuels avertissements. Cet outil n'est PAS médical.
 */

import type { RecoveryCheckin, RecoveryRecommendation } from '@/models';

export interface RecoveryAssessment {
  recommendation: RecoveryRecommendation;
  /** Ajustement de charge suggéré (multiplicateur, ex 0.9 = -10 %). */
  loadMultiplier: number;
  /** Retirer une série ? */
  dropOneSet: boolean;
  warnings: string[];
  message: string;
}

/** Évalue un check-in (énergie/sommeil/douleur/motivation/fatigue). */
export function assessCheckin(checkin: {
  energy: number;
  sleepQuality: number;
  soreness: number;
  motivation: number;
  pain: boolean;
}): RecoveryAssessment {
  const warnings: string[] = [];

  if (checkin.pain) {
    warnings.push(
      'Douleur déclarée. En cas de douleur persistante ou inhabituelle, consultez un professionnel de santé.',
    );
    return {
      recommendation: 'rest',
      loadMultiplier: 0.7,
      dropOneSet: true,
      warnings,
      message: 'Douleur signalée : privilégiez la récupération ou une séance très légère.',
    };
  }

  // Score de fraîcheur : plus il est bas, plus on allège.
  const freshness =
    checkin.energy + checkin.sleepQuality + checkin.motivation + (6 - checkin.soreness);
  // Plage théorique ~ [3, 20].

  if (freshness <= 8) {
    warnings.push('Fatigue élevée détectée.');
    return {
      recommendation: 'reduce_load',
      loadMultiplier: 0.85,
      dropOneSet: true,
      warnings,
      message: 'Journée fatiguée : réduisez légèrement les charges et le volume.',
    };
  }
  if (freshness <= 12) {
    return {
      recommendation: 'reduce_volume',
      loadMultiplier: 0.95,
      dropOneSet: false,
      warnings,
      message: 'Forme moyenne : conservez la séance mais restez à l\'écoute.',
    };
  }
  return {
    recommendation: 'proceed',
    loadMultiplier: 1,
    dropOneSet: false,
    warnings,
    message: 'Bonne forme : séance prévue conservée. Bon entraînement !',
  };
}

export interface SafetySignals {
  /** Hausse de charge proposée vs séance précédente (ratio, ex 1.2 = +20 %). */
  loadIncreaseRatio?: number;
  /** Volume de la séance vs moyenne récente (ratio). */
  volumeRatio?: number;
  /** Nombre de jours consécutifs à entraîner le même muscle sans repos. */
  sameMuscleConsecutiveDays?: number;
  /** Tendance de performance sur les dernières séances (< 0 = baisse). */
  performanceTrend?: number;
}

/**
 * Génère des avertissements de sécurité à partir de signaux objectifs.
 * Aucune de ces alertes ne constitue un avis médical.
 */
export function safetyWarnings(signals: SafetySignals): string[] {
  const warnings: string[] = [];
  if ((signals.loadIncreaseRatio ?? 1) >= 1.2) {
    warnings.push('Hausse de charge importante (> 20 %). Progressez graduellement.');
  }
  if ((signals.volumeRatio ?? 1) >= 1.5) {
    warnings.push('Volume anormalement élevé par rapport à vos séances récentes.');
  }
  if ((signals.sameMuscleConsecutiveDays ?? 0) >= 3) {
    warnings.push('Ce muscle est sollicité plusieurs jours de suite sans repos suffisant.');
  }
  if ((signals.performanceTrend ?? 0) < -0.1) {
    warnings.push('Baisse continue des performances : pensez à récupérer davantage.');
  }
  return warnings;
}

export const RECOVERY_DISCLAIMER =
  "REPZ n'est pas un outil médical. En cas de douleur persistante ou inhabituelle, consultez un professionnel de santé.";
