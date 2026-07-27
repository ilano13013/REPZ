/**
 * Store de la séance en cours.
 *
 * Construit une séance à partir d'un jour de programme (ou à vide), gère la
 * saisie et la validation des séries avec calcul d'XP en direct, la détection
 * des records, puis la clôture qui orchestre profil, muscles, quêtes et boss.
 */

import { create } from 'zustand';
import type {
  Exercise,
  PersonalRecord,
  SetEntry,
  Workout,
  WorkoutExercise,
} from '@/models';
import { getExercise } from '@/data/exercises';
import { PROGRAMS_BY_ID } from '@/data/programs';
import { computeSetXp, type XpContext } from '@/engines/xpEngine';
import { detectSetRecords } from '@/engines/personalRecordEngine';
import { workoutVolume, workoutMuscles } from '@/engines/workoutEngine';
import { workoutRepo } from '@/db/repositories';
import { uid } from '@/utils/id';
import { startOfDay, DAY_MS } from '@/utils/date';
import { useProfileStore, isFirstWorkoutOfDay } from './profileStore';
import { useGameStore } from './gameStore';

export interface SetValidationResult {
  xp: number;
  records: PersonalRecord[];
}

interface SessionState {
  workout: Workout | null;
  /** Records existants chargés au démarrage (pour la détection en direct). */
  records: PersonalRecord[];
  /** XP déjà gagnée aujourd'hui (plafond quotidien). */
  dailyXp: number;
  restEndsAt: number | null;

  startFromProgramDay: (programId: string, dayId: string) => Promise<void>;
  startEmpty: () => Promise<void>;
  addExercise: (exerciseId: string) => void;
  replaceExercise: (workoutExerciseId: string, exerciseId: string) => void;
  skipExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  copyPreviousSet: (workoutExerciseId: string, setId: string) => void;
  validateSet: (workoutExerciseId: string, setId: string) => Promise<SetValidationResult>;
  startRest: (seconds: number) => void;
  clearRest: () => void;
  setNote: (note: string) => void;
  finishWorkout: () => Promise<{ totalXp: number; volume: number }>;
  discard: () => void;
}

function newSet(workoutExerciseId: string, order: number): SetEntry {
  return {
    id: uid('set'),
    workoutExerciseId,
    order,
    weightKg: null,
    reps: null,
    durationSec: null,
    distanceM: null,
    rpe: null,
    completed: false,
    xpEarned: 0,
    isPersonalRecord: false,
  };
}

function buildExercise(workoutId: string, exerciseId: string, order: number, sets: number): WorkoutExercise {
  const weId = uid('we');
  return {
    id: weId,
    workoutId,
    exerciseId,
    order,
    note: null,
    skipped: false,
    sets: Array.from({ length: Math.max(1, sets) }, (_, i) => newSet(weId, i)),
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  workout: null,
  records: [],
  dailyXp: 0,
  restEndsAt: null,

  startFromProgramDay: async (programId, dayId) => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const program = PROGRAMS_BY_ID[programId];
    const day = program?.days.find((d) => d.id === dayId);
    const workoutId = uid('w');
    const exercises: WorkoutExercise[] =
      day?.exercises
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((t, i) => buildExercise(workoutId, t.exerciseId, i, t.sets)) ?? [];

    const workout: Workout = {
      id: workoutId,
      userId: profile.id,
      programId,
      programDayId: dayId,
      name: day?.name ?? program?.name ?? 'Séance',
      status: 'in_progress',
      startedAt: Date.now(),
      completedAt: null,
      note: null,
      totalXp: 0,
      totalVolumeKg: 0,
      exercises,
    };

    const now = Date.now();
    const records = await workoutRepo.listRecords(profile.id);
    const dailyXp = await workoutRepo.sumXpToday(profile.id, startOfDay(now), startOfDay(now) + DAY_MS - 1);
    set({ workout, records, dailyXp, restEndsAt: null });
  },

  startEmpty: async () => {
    const profile = useProfileStore.getState().profile;
    if (!profile) return;
    const workoutId = uid('w');
    const now = Date.now();
    const records = await workoutRepo.listRecords(profile.id);
    const dailyXp = await workoutRepo.sumXpToday(profile.id, startOfDay(now), startOfDay(now) + DAY_MS - 1);
    set({
      workout: {
        id: workoutId,
        userId: profile.id,
        programId: null,
        programDayId: null,
        name: 'Séance libre',
        status: 'in_progress',
        startedAt: now,
        completedAt: null,
        note: null,
        totalXp: 0,
        totalVolumeKg: 0,
        exercises: [],
      },
      records,
      dailyXp,
      restEndsAt: null,
    });
  },

  addExercise: (exerciseId) => {
    const w = get().workout;
    if (!w) return;
    const ex = getExercise(exerciseId);
    const we = buildExercise(w.id, exerciseId, w.exercises.length, ex?.recommended.sets ?? 3);
    set({ workout: { ...w, exercises: [...w.exercises, we] } });
  },

  replaceExercise: (workoutExerciseId, exerciseId) => {
    const w = get().workout;
    if (!w) return;
    set({
      workout: {
        ...w,
        exercises: w.exercises.map((we) =>
          we.id === workoutExerciseId ? { ...we, exerciseId, sets: we.sets.map((s) => ({ ...s, completed: false, xpEarned: 0, isPersonalRecord: false })) } : we,
        ),
      },
    });
  },

  skipExercise: (workoutExerciseId) => {
    const w = get().workout;
    if (!w) return;
    set({
      workout: {
        ...w,
        exercises: w.exercises.map((we) =>
          we.id === workoutExerciseId ? { ...we, skipped: !we.skipped } : we,
        ),
      },
    });
  },

  addSet: (workoutExerciseId) => {
    const w = get().workout;
    if (!w) return;
    set({
      workout: {
        ...w,
        exercises: w.exercises.map((we) =>
          we.id === workoutExerciseId
            ? { ...we, sets: [...we.sets, newSet(we.id, we.sets.length)] }
            : we,
        ),
      },
    });
  },

  removeSet: (workoutExerciseId, setId) => {
    const w = get().workout;
    if (!w) return;
    set({
      workout: {
        ...w,
        exercises: w.exercises.map((we) =>
          we.id === workoutExerciseId
            ? { ...we, sets: we.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, order: i })) }
            : we,
        ),
      },
    });
  },

  updateSet: (workoutExerciseId, setId, patch) => {
    const w = get().workout;
    if (!w) return;
    set({
      workout: {
        ...w,
        exercises: w.exercises.map((we) =>
          we.id === workoutExerciseId
            ? { ...we, sets: we.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
            : we,
        ),
      },
    });
  },

  copyPreviousSet: (workoutExerciseId, setId) => {
    const w = get().workout;
    if (!w) return;
    const we = w.exercises.find((x) => x.id === workoutExerciseId);
    if (!we) return;
    const idx = we.sets.findIndex((s) => s.id === setId);
    if (idx <= 0) return;
    const prev = we.sets[idx - 1];
    get().updateSet(workoutExerciseId, setId, {
      weightKg: prev.weightKg,
      reps: prev.reps,
      durationSec: prev.durationSec,
      distanceM: prev.distanceM,
      rpe: prev.rpe,
    });
  },

  validateSet: async (workoutExerciseId, setId) => {
    const w = get().workout;
    const profile = useProfileStore.getState().profile;
    if (!w || !profile) return { xp: 0, records: [] };

    const we = w.exercises.find((x) => x.id === workoutExerciseId);
    const target = we?.sets.find((s) => s.id === setId);
    const exercise = we ? getExercise(we.exerciseId) : undefined;
    if (!we || !target || !exercise) return { xp: 0, records: [] };

    // Détection des records (avant recalcul, pour appliquer le bonus PR).
    const detected = detectSetRecords(exercise.id, target, get().records);
    const isPR = detected.length > 0;

    const setIndex = we.sets.filter((s) => s.completed).length;
    const ctx: XpContext = {
      userBodyweightKg: profile.weightKg ?? 75,
      isPersonalRecord: isPR,
      setIndexInExercise: setIndex,
      isFirstSetOfDay: isFirstWorkoutOfDay(profile) && setIndex === 0,
      weeklyStreak: profile.currentStreak,
      followsProgram: !!w.programId,
      dailyXpSoFar: get().dailyXp,
      previousBestVolume:
        get().records.find((r) => r.exerciseId === exercise.id && r.type === 'best_set_volume')?.value ?? null,
    };

    const { xp } = computeSetXp(exercise, target, ctx);

    // Persiste les nouveaux records détectés + met à jour l'état local.
    const newRecords: PersonalRecord[] = [];
    for (const d of detected) {
      const rec: PersonalRecord = {
        id: uid('pr'),
        userId: profile.id,
        exerciseId: exercise.id,
        type: d.type,
        value: d.value,
        context: d.context,
        achievedAt: Date.now(),
        workoutId: w.id,
      };
      await workoutRepo.upsertRecord(rec);
      newRecords.push(rec);
    }

    // Fusionne les records dans l'état (remplace ceux du même type).
    const mergedRecords = [
      ...get().records.filter(
        (r) => !newRecords.some((n) => n.exerciseId === r.exerciseId && n.type === r.type && n.context === r.context),
      ),
      ...newRecords,
    ];

    get().updateSet(workoutExerciseId, setId, {
      completed: true,
      xpEarned: xp,
      isPersonalRecord: isPR,
    });

    set({ dailyXp: get().dailyXp + xp, records: mergedRecords });

    // XP musculaire immédiate (répartie par groupe).
    await useProfileStore.getState().addMuscleXp(exercise, xp);

    return { xp, records: newRecords };
  },

  startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000 }),
  clearRest: () => set({ restEndsAt: null }),
  setNote: (note) => {
    const w = get().workout;
    if (w) set({ workout: { ...w, note } });
  },

  finishWorkout: async () => {
    const w = get().workout;
    const profileStore = useProfileStore.getState();
    const profile = profileStore.profile;
    if (!w || !profile) return { totalXp: 0, volume: 0 };

    const volume = workoutVolume(w);
    const setXp = w.exercises.reduce(
      (acc, we) => acc + we.sets.reduce((a, s) => a + (s.completed ? s.xpEarned : 0), 0),
      0,
    );

    const completed: Workout = {
      ...w,
      status: 'completed',
      completedAt: Date.now(),
      totalXp: setXp,
      totalVolumeKg: volume,
    };
    await workoutRepo.saveWorkout(completed);

    // XP de complétion de séance (bonus fixe).
    await profileStore.addXp(setXp, 'workout', w.id);
    const bonus = await useGameStore.getState().applyWorkoutCompletion(completed);

    // Mise à jour de la série (streak) et de la date de dernier entraînement.
    const brokeRecord = w.exercises.some((we) => we.sets.some((s) => s.isPersonalRecord));
    await profileStore.updateProfile({
      lastWorkoutDate: completed.completedAt,
      currentStreak: profile.currentStreak, // recalculé par gameStore hebdo
    });
    if (brokeRecord) await profileStore.unlockBadge('record_breaker');
    await profileStore.unlockBadge('first_workout');

    set({ workout: null, restEndsAt: null });
    return { totalXp: setXp + bonus, volume };
  },

  discard: () => set({ workout: null, restEndsAt: null }),
}));

/** Sélecteur : muscles entraînés dans la séance courante. */
export function selectSessionMuscles(w: Workout | null) {
  if (!w) return [];
  return workoutMuscles(w, getExercise);
}
