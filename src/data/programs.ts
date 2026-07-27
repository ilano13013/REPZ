/**
 * Programmes prédéfinis.
 *
 * Chaque programme référence des exercices du catalogue (`exercises.ts`) et
 * sert de modèle : à la création d'un programme personnalisé, on peut dupliquer
 * puis modifier ces structures.
 */

import type { Program, ProgramDay, ProgramExerciseTemplate } from '@/models';

function ex(
  exerciseId: string,
  order: number,
  sets: number,
  targetReps: string,
  restSeconds: number,
): ProgramExerciseTemplate {
  return { exerciseId, order, sets, targetReps, restSeconds };
}

function day(id: string, name: string, order: number, exercises: ProgramExerciseTemplate[]): ProgramDay {
  return { id, name, order, exercises };
}

export const PROGRAMS: Program[] = [
  {
    id: 'full_body_2',
    name: 'Full Body 2 jours',
    description: 'Deux séances complètes par semaine, idéal pour démarrer.',
    daysPerWeek: 2,
    goal: 'general_fitness',
    level: 'beginner',
    isPreset: true,
    days: [
      day('fb2_a', 'Full Body A', 0, [
        ex('back_squat', 0, 3, '8-10', 120),
        ex('bench_press', 1, 3, '8-10', 120),
        ex('barbell_row', 2, 3, '8-10', 120),
        ex('overhead_press', 3, 3, '10-12', 90),
        ex('plank', 4, 3, '40s', 45),
      ]),
      day('fb2_b', 'Full Body B', 1, [
        ex('romanian_deadlift', 0, 3, '8-10', 120),
        ex('incline_db_press', 1, 3, '10-12', 90),
        ex('lat_pulldown', 2, 3, '10-12', 90),
        ex('lateral_raise', 3, 3, '12-15', 60),
        ex('crunch', 4, 3, '15-20', 40),
      ]),
    ],
  },
  {
    id: 'full_body_3',
    name: 'Full Body 3 jours',
    description: 'Trois séances complètes, bon équilibre volume/récupération.',
    daysPerWeek: 3,
    goal: 'general_fitness',
    level: 'beginner',
    isPreset: true,
    days: [
      day('fb3_a', 'Jour A', 0, [
        ex('back_squat', 0, 4, '6-8', 150),
        ex('bench_press', 1, 4, '6-8', 120),
        ex('barbell_row', 2, 4, '8-10', 120),
        ex('barbell_curl', 3, 3, '10-12', 60),
      ]),
      day('fb3_b', 'Jour B', 1, [
        ex('deadlift', 0, 3, '5', 180),
        ex('overhead_press', 1, 4, '6-8', 120),
        ex('pullup', 2, 4, '6-10', 120),
        ex('triceps_pushdown', 3, 3, '12-15', 60),
      ]),
      day('fb3_c', 'Jour C', 2, [
        ex('front_squat', 0, 4, '8-10', 120),
        ex('incline_db_press', 1, 4, '8-12', 90),
        ex('seated_row', 2, 4, '10-12', 90),
        ex('hanging_leg_raise', 3, 3, '10-15', 60),
      ]),
    ],
  },
  {
    id: 'upper_lower_4',
    name: 'Upper/Lower 4 jours',
    description: 'Haut/bas du corps sur 4 jours, pour progresser en volume.',
    daysPerWeek: 4,
    goal: 'muscle_gain',
    level: 'intermediate',
    isPreset: true,
    days: [
      day('ul_upper_a', 'Haut A', 0, [
        ex('bench_press', 0, 4, '6-8', 120),
        ex('barbell_row', 1, 4, '6-8', 120),
        ex('db_shoulder_press', 2, 3, '8-12', 90),
        ex('barbell_curl', 3, 3, '10-12', 60),
        ex('triceps_pushdown', 4, 3, '10-12', 60),
      ]),
      day('ul_lower_a', 'Bas A', 1, [
        ex('back_squat', 0, 4, '6-8', 150),
        ex('romanian_deadlift', 1, 3, '8-10', 120),
        ex('leg_press', 2, 3, '10-12', 90),
        ex('standing_calf_raise', 3, 4, '12-15', 45),
      ]),
      day('ul_upper_b', 'Haut B', 2, [
        ex('incline_db_press', 0, 4, '8-12', 90),
        ex('lat_pulldown', 1, 4, '8-12', 90),
        ex('lateral_raise', 2, 4, '12-20', 45),
        ex('hammer_curl', 3, 3, '10-14', 60),
        ex('skullcrusher', 4, 3, '8-12', 75),
      ]),
      day('ul_lower_b', 'Bas B', 3, [
        ex('deadlift', 0, 3, '5', 180),
        ex('front_squat', 1, 3, '8-10', 120),
        ex('leg_curl', 2, 3, '10-15', 60),
        ex('seated_calf_raise', 3, 4, '12-20', 45),
      ]),
    ],
  },
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    description: 'Poussée / tirage / jambes, grand classique hypertrophie.',
    daysPerWeek: 6,
    goal: 'muscle_gain',
    level: 'intermediate',
    isPreset: true,
    days: [
      day('ppl_push', 'Push', 0, [
        ex('bench_press', 0, 4, '6-10', 120),
        ex('db_shoulder_press', 1, 3, '8-12', 90),
        ex('incline_db_press', 2, 3, '8-12', 90),
        ex('lateral_raise', 3, 3, '12-20', 45),
        ex('triceps_pushdown', 4, 3, '10-15', 60),
      ]),
      day('ppl_pull', 'Pull', 1, [
        ex('deadlift', 0, 3, '5', 180),
        ex('pullup', 1, 4, '6-10', 120),
        ex('barbell_row', 2, 3, '8-10', 120),
        ex('face_pull', 3, 3, '12-20', 45),
        ex('barbell_curl', 4, 3, '10-12', 60),
      ]),
      day('ppl_legs', 'Legs', 2, [
        ex('back_squat', 0, 4, '6-10', 150),
        ex('romanian_deadlift', 1, 3, '8-10', 120),
        ex('leg_press', 2, 3, '10-15', 90),
        ex('leg_curl', 3, 3, '10-15', 60),
        ex('standing_calf_raise', 4, 4, '12-20', 45),
      ]),
    ],
  },
  {
    id: 'strength',
    name: 'Prise de force',
    description: 'Focalisé sur les mouvements lourds et la force maximale.',
    daysPerWeek: 3,
    goal: 'strength',
    level: 'intermediate',
    isPreset: true,
    days: [
      day('str_a', 'Squat', 0, [
        ex('back_squat', 0, 5, '3-5', 210),
        ex('bench_press', 1, 3, '5', 180),
        ex('barbell_row', 2, 3, '6-8', 120),
      ]),
      day('str_b', 'Deadlift', 1, [
        ex('deadlift', 0, 5, '3-5', 240),
        ex('overhead_press', 1, 4, '5', 180),
        ex('pullup', 2, 3, '6-10', 120),
      ]),
      day('str_c', 'Bench', 2, [
        ex('bench_press', 0, 5, '3-5', 210),
        ex('front_squat', 1, 3, '5', 180),
        ex('seated_row', 2, 3, '8-10', 120),
      ]),
    ],
  },
  {
    id: 'mass',
    name: 'Prise de masse',
    description: 'Volume élevé sur les gros groupes musculaires.',
    daysPerWeek: 4,
    goal: 'muscle_gain',
    level: 'intermediate',
    isPreset: true,
    days: [
      day('mass_chest', 'Pecs/Triceps', 0, [
        ex('bench_press', 0, 4, '8-12', 90),
        ex('incline_db_press', 1, 4, '10-12', 90),
        ex('chest_fly', 2, 3, '12-15', 60),
        ex('skullcrusher', 3, 3, '10-12', 60),
        ex('triceps_pushdown', 4, 3, '12-15', 45),
      ]),
      day('mass_back', 'Dos/Biceps', 1, [
        ex('barbell_row', 0, 4, '8-12', 90),
        ex('lat_pulldown', 1, 4, '10-12', 90),
        ex('seated_row', 2, 3, '10-12', 75),
        ex('barbell_curl', 3, 3, '10-12', 60),
        ex('hammer_curl', 4, 3, '12-15', 45),
      ]),
      day('mass_legs', 'Jambes', 2, [
        ex('back_squat', 0, 4, '8-12', 120),
        ex('leg_press', 1, 4, '12-15', 90),
        ex('leg_curl', 2, 4, '12-15', 60),
        ex('standing_calf_raise', 3, 4, '15-20', 45),
      ]),
      day('mass_shoulders', 'Épaules/Abdos', 3, [
        ex('overhead_press', 0, 4, '8-12', 90),
        ex('lateral_raise', 1, 4, '15-20', 45),
        ex('face_pull', 2, 3, '15-20', 45),
        ex('hanging_leg_raise', 3, 4, '10-15', 60),
      ]),
    ],
  },
  {
    id: 'home_no_equipment',
    name: 'Entraînement maison sans matériel',
    description: 'Full body au poids du corps, aucun équipement requis.',
    daysPerWeek: 3,
    goal: 'general_fitness',
    level: 'beginner',
    isPreset: true,
    days: [
      day('home_a', 'Maison A', 0, [
        ex('pushup', 0, 4, '10-20', 60),
        ex('bodyweight_squat', 1, 4, '15-25', 60),
        ex('lunge', 2, 3, '12-16', 60),
        ex('plank', 3, 3, '40-60s', 45),
        ex('crunch', 4, 3, '15-25', 40),
      ]),
      day('home_b', 'Maison B', 1, [
        ex('dips', 0, 3, '8-15', 75),
        ex('glute_bridge', 1, 4, '15-25', 45),
        ex('mountain_climbers', 2, 3, '40s', 45),
        ex('burpees', 3, 3, '10-15', 75),
        ex('russian_twist', 4, 3, '20-30', 40),
      ]),
      day('home_c', 'Maison C', 2, [
        ex('pushup', 0, 4, '12-20', 60),
        ex('lunge', 1, 4, '12-16', 60),
        ex('jump_rope', 2, 3, '90s', 45),
        ex('plank', 3, 3, '45-60s', 45),
      ]),
    ],
  },
  {
    id: 'beginner',
    name: 'Programme débutant',
    description: 'Introduction en douceur aux mouvements de base.',
    daysPerWeek: 3,
    goal: 'general_fitness',
    level: 'beginner',
    isPreset: true,
    days: [
      day('beg_a', 'Découverte A', 0, [
        ex('leg_press', 0, 3, '10-12', 90),
        ex('bench_press', 1, 3, '8-10', 90),
        ex('lat_pulldown', 2, 3, '10-12', 90),
        ex('plank', 3, 3, '30s', 45),
      ]),
      day('beg_b', 'Découverte B', 1, [
        ex('bodyweight_squat', 0, 3, '15-20', 60),
        ex('incline_db_press', 1, 3, '10-12', 90),
        ex('seated_row', 2, 3, '10-12', 90),
        ex('db_curl', 3, 2, '12-15', 60),
      ]),
      day('beg_c', 'Découverte C', 2, [
        ex('leg_extension', 0, 3, '12-15', 60),
        ex('db_shoulder_press', 1, 3, '10-12', 90),
        ex('lat_pulldown', 2, 3, '10-12', 90),
        ex('crunch', 3, 3, '15-20', 40),
      ]),
    ],
  },
  {
    id: 'express_30',
    name: 'Programme express 30 minutes',
    description: 'Séances courtes et efficaces pour les emplois du temps chargés.',
    daysPerWeek: 3,
    goal: 'maintenance',
    level: 'beginner',
    isPreset: true,
    days: [
      day('exp_a', 'Express A', 0, [
        ex('back_squat', 0, 3, '8-10', 90),
        ex('bench_press', 1, 3, '8-10', 90),
        ex('barbell_row', 2, 3, '8-10', 90),
      ]),
      day('exp_b', 'Express B', 1, [
        ex('romanian_deadlift', 0, 3, '8-10', 90),
        ex('db_shoulder_press', 1, 3, '10-12', 75),
        ex('lat_pulldown', 2, 3, '10-12', 75),
      ]),
      day('exp_c', 'Express C', 2, [
        ex('leg_press', 0, 3, '10-12', 75),
        ex('incline_db_press', 1, 3, '10-12', 75),
        ex('seated_row', 2, 3, '10-12', 75),
      ]),
    ],
  },
];

export const PROGRAMS_BY_ID: Record<string, Program> = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p]),
);

/** Recommande un programme à partir de l'objectif et du niveau de l'utilisateur. */
export function recommendProgram(
  goal: string,
  level: string,
  sessionsPerWeek: number,
): Program {
  const byGoal = PROGRAMS.filter((p) => p.goal === goal);
  const pool = byGoal.length > 0 ? byGoal : PROGRAMS;
  // On privilégie le programme dont le nombre de jours est le plus proche.
  const sorted = [...pool].sort(
    (a, b) => Math.abs(a.daysPerWeek - sessionsPerWeek) - Math.abs(b.daysPerWeek - sessionsPerWeek),
  );
  const matchingLevel = sorted.find((p) => p.level === level);
  return matchingLevel ?? sorted[0] ?? PROGRAMS[0];
}
