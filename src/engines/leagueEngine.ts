/**
 * Moteur de ligue.
 *
 * Calcule un score de ligue basé sur la PROGRESSION RELATIVE et l'assiduité
 * (et non le poids brut soulevé, pour ne pas désavantager les débutants), gère
 * les divisions et simule des profils fictifs. Prêt à être remplacé par un
 * classement en ligne (voir `src/sync`).
 */

import type { LeagueDivision, LeagueMember } from '@/models';

export const DIVISIONS: LeagueDivision[] = [
  'iron',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'elite',
  'titan',
];

export const DIVISION_LABEL: Record<LeagueDivision, string> = {
  iron: 'Fer',
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
  diamond: 'Diamant',
  elite: 'Élite',
  titan: 'Titan',
};

/** Seuils de score minimaux par division. */
const DIVISION_THRESHOLDS: Record<LeagueDivision, number> = {
  iron: 0,
  bronze: 300,
  silver: 700,
  gold: 1200,
  platinum: 1800,
  diamond: 2600,
  elite: 3600,
  titan: 5000,
};

export interface LeagueScoreInputs {
  /** Progression relative moyenne (%) sur la période. */
  relativeProgressPct: number;
  /** Régularité : ratio séances réalisées / prévues [0, 1]. */
  consistency: number;
  /** Quêtes terminées sur la période. */
  questsCompleted: number;
  /** Séances validées sur la période. */
  workoutsCompleted: number;
  /** Amélioration personnelle (nombre de records battus). */
  personalImprovements: number;
}

/**
 * Calcule le score de ligue. Pondération volontairement centrée sur les
 * progrès et l'assiduité plutôt que sur la force absolue.
 */
export function computeLeagueScore(inputs: LeagueScoreInputs): number {
  const progress = Math.max(0, inputs.relativeProgressPct) * 12;
  const consistency = Math.max(0, Math.min(1, inputs.consistency)) * 400;
  const quests = inputs.questsCompleted * 40;
  const workouts = inputs.workoutsCompleted * 60;
  const improvements = inputs.personalImprovements * 50;
  return Math.round(progress + consistency + quests + workouts + improvements);
}

/** Division correspondant à un score. */
export function divisionForScore(score: number): LeagueDivision {
  let division: LeagueDivision = 'iron';
  for (const d of DIVISIONS) {
    if (score >= DIVISION_THRESHOLDS[d]) division = d;
    else break;
  }
  return division;
}

/**
 * Génère un classement local avec des profils fictifs autour du score de
 * l'utilisateur, pour donner vie à la ligue avant l'activation du online.
 */
export function buildLocalLeaderboard(
  userScore: number,
  userName: string,
  count = 9,
): LeagueMember[] {
  const division = divisionForScore(userScore);
  const fakeNames = [
    'IronFox', 'NovaLift', 'RepQueen', 'MaxPower', 'GymWolf',
    'TitanRise', 'FlexZero', 'SteelJane', 'CardioKid', 'PRHunter',
    'BraveBear', 'SwiftRep',
  ];
  const members: LeagueMember[] = fakeNames.slice(0, count).map((name, i) => {
    const spread = (i - count / 2) * 120 + (Math.sin(i * 3.1) * 90);
    const score = Math.max(0, Math.round(userScore + spread));
    return { id: `bot_${i}`, name, isUser: false, score, division };
  });
  members.push({ id: 'user', name: userName, isUser: true, score: userScore, division });
  return members.sort((a, b) => b.score - a.score);
}
