/**
 * Store des programmes : fusionne les programmes prédéfinis (constantes) et les
 * programmes personnalisés (persistés). Gère création, duplication, édition,
 * réorganisation d'exercices et suppression.
 */

import { create } from 'zustand';
import type { Program, ProgramDay, ProgramExerciseTemplate } from '@/models';
import { PROGRAMS, PROGRAMS_BY_ID } from '@/data/programs';
import { programRepo } from '@/db/repositories';
import { getExercise } from '@/data/exercises';
import { uid } from '@/utils/id';
import { useProfileStore } from './profileStore';

interface ProgramState {
  custom: Program[];
  load: () => Promise<void>;
  /** Tous les programmes (prédéfinis + personnalisés). */
  all: () => Program[];
  getById: (id: string) => Program | undefined;
  /** Duplique un programme (préréglé ou perso) en un nouveau programme éditable. */
  duplicate: (sourceId: string) => Promise<Program | null>;
  /** Crée un programme vierge. */
  createBlank: (name: string) => Promise<Program>;
  save: (program: Program) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  custom: [],

  load: async () => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const custom = await programRepo.listCustomPrograms(profile.id);
    set({ custom });
  },

  all: () => [...PROGRAMS, ...get().custom],

  getById: (id) => PROGRAMS_BY_ID[id] ?? get().custom.find((p) => p.id === id),

  duplicate: async (sourceId) => {
    const profile = useProfileStore.getState().profile;
    const source = get().getById(sourceId);
    if (!profile || !source) return null;
    const copy: Program = {
      ...source,
      id: uid('prog'),
      name: `${source.name} (copie)`,
      isPreset: false,
      days: source.days.map((d) => ({
        ...d,
        id: uid('day'),
        exercises: d.exercises.map((e) => ({ ...e })),
      })),
    };
    await programRepo.saveCustomProgram(profile.id, copy);
    set({ custom: [...get().custom, copy] });
    return copy;
  },

  createBlank: async (name) => {
    const profile = useProfileStore.getState().profile;
    const program: Program = {
      id: uid('prog'),
      name: name || 'Nouveau programme',
      description: 'Programme personnalisé',
      daysPerWeek: 1,
      goal: profile?.goal ?? 'general_fitness',
      level: profile?.fitnessLevel ?? 'beginner',
      isPreset: false,
      days: [{ id: uid('day'), name: 'Jour 1', order: 0, exercises: [] }],
    };
    if (profile) {
      await programRepo.saveCustomProgram(profile.id, program);
      set({ custom: [...get().custom, program] });
    }
    return program;
  },

  save: async (program) => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const normalized: Program = { ...program, daysPerWeek: program.days.length };
    await programRepo.saveCustomProgram(profile.id, normalized);
    set({ custom: get().custom.map((p) => (p.id === normalized.id ? normalized : p)) });
  },

  remove: async (id) => {
    await programRepo.deleteCustomProgram(id);
    set({ custom: get().custom.filter((p) => p.id !== id) });
    // Si c'était le programme actif, on bascule sur un préréglé.
    const profile = useProfileStore.getState().profile;
    if (profile?.activeProgramId === id) {
      await useProfileStore.getState().updateProfile({ activeProgramId: PROGRAMS[0].id });
    }
  },
}));

// -------------------- Helpers d'édition immuables (jour / exercices) ----------

export function addExerciseToDay(
  program: Program,
  dayId: string,
  exerciseId: string,
): Program {
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

export function removeExerciseFromDay(program: Program, dayId: string, index: number): Program {
  return {
    ...program,
    days: program.days.map((d) =>
      d.id === dayId
        ? { ...d, exercises: d.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i })) }
        : d,
    ),
  };
}

/** Déplace un exercice vers le haut (-1) ou le bas (+1) dans la liste du jour. */
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

export function addDay(program: Program): Program {
  const day: ProgramDay = {
    id: uid('day'),
    name: `Jour ${program.days.length + 1}`,
    order: program.days.length,
    exercises: [],
  };
  return { ...program, days: [...program.days, day] };
}

export function removeDay(program: Program, dayId: string): Program {
  const days = program.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, order: i }));
  return { ...program, days: days.length ? days : program.days };
}
