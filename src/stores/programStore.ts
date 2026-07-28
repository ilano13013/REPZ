/**
 * Store des programmes : fusionne les programmes prédéfinis (constantes) et les
 * programmes personnalisés (persistés). Gère création, duplication, édition,
 * réorganisation d'exercices et suppression.
 */

import { create } from 'zustand';
import type { Program } from '@/models';
import { PROGRAMS, PROGRAMS_BY_ID } from '@/data/programs';
import { programRepo } from '@/db/repositories';
import { uid } from '@/utils/id';
import { useProfileStore } from './profileStore';

// Les transformations d'édition sont des fonctions pures (moteur testable).
export {
  addExerciseToDay,
  removeExerciseFromDay,
  moveExercise,
  addDay,
  removeDay,
  duplicateDay,
} from '@/engines/programEditor';

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
