/**
 * Moteur d'édition de programme.
 *
 * Transformations PURES et immuables sur un `Program` : ajout/retrait/
 * réorganisation d'exercices, ajout/suppression/duplication de jours.
 * Aucune dépendance à la base ni à React — entièrement testable.
 */

import type { Program, ProgramDay, ProgramExerciseTemplate } from '@/models';
import { getExercise } from '@/data/exercises';
import { uid } from '@/utils/id';

/** Ajoute un exercice à la fin d'un jour, avec les recommandations par défaut. */
export function addExerciseToDay(program: Program, dayId: string, exerciseId: string): Program {
  const ex = getExercise(exerciseId);
  const template: ProgramExerciseTemplate = {
    exerciseId,
    order: 0,
    sets: ex?.recommended.sets ?? 3,
    targetReps: ex?.recommended.reps ?? '8-12',
    restSeconds: ex?.recommended.restSeconds ?? 90,
  };
  return {
    ...program,
    days: program.days.map((d) =>
      d.id === dayId
        ? { ...d, exercises: [...d.exercises, { ...template, order: d.exercises.length }] }
        : d,
    ),
  };
}

/** Retire l'exercice à l'index donné et renumérote les suivants. */
export function removeExerciseFromDay(program: Program, dayId: string, index: number): Program {
  return {
    ...program,
    days: program.days.map((d) =>
      d.id === dayId
        ? {
            ...d,
            exercises: d.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i })),
          }
        : d,
    ),
  };
}

/** Déplace un exercice vers le haut (-1) ou le bas (+1). Sans effet aux bornes. */
export function moveExercise(program: Program, dayId: string, index: number, dir: -1 | 1): Program {
  return {
    ...program,
    days: program.days.map((d) => {
      if (d.id !== dayId) return d;
      const target = index + dir;
      if (target < 0 || target >= d.exercises.length) return d;
      const list = [...d.exercises];
      [list[index], list[target]] = [list[target], list[index]];
      return { ...d, exercises: list.map((e, i) => ({ ...e, order: i })) };
    }),
  };
}

/** Ajoute un jour vide à la fin du programme. */
export function addDay(program: Program): Program {
  const day: ProgramDay = {
    id: uid('day'),
    name: `Jour ${program.days.length + 1}`,
    order: program.days.length,
    exercises: [],
  };
  return { ...program, days: [...program.days, day] };
}

/** Supprime un jour. Le programme conserve toujours au moins un jour. */
export function removeDay(program: Program, dayId: string): Program {
  const days = program.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, order: i }));
  return { ...program, days: days.length ? days : program.days };
}

/** Duplique une séance (jour) et l'insère juste après l'originale. */
export function duplicateDay(program: Program, dayId: string): Program {
  const index = program.days.findIndex((d) => d.id === dayId);
  if (index < 0) return program;
  const source = program.days[index];
  const copy: ProgramDay = {
    id: uid('day'),
    name: `${source.name} (copie)`,
    order: index + 1,
    exercises: source.exercises.map((e) => ({ ...e })),
  };
  const days = [...program.days];
  days.splice(index + 1, 0, copy);
  return { ...program, days: days.map((d, i) => ({ ...d, order: i })) };
}
