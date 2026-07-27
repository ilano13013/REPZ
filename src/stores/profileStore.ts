/**
 * Store du profil et de la gamification centrale (XP, niveau, stats, muscles,
 * badges). Orchestre les moteurs `levelEngine` et `muscleProgressEngine` et
 * persiste via les dépôts.
 */

import { create } from 'zustand';
import type {
  CharacterStats,
  Exercise,
  MuscleGroup,
  MuscleProgress,
  UserBadge,
  UserProfile,
  UserSettings,
} from '@/models';
import { profileRepo, workoutRepo } from '@/db/repositories';
import { computeLevelUp, resolveLevel, type LevelUpResult } from '@/engines/levelEngine';
import { distributeXpToMuscles, resolveMuscleLevel } from '@/engines/muscleProgressEngine';
import { uid } from '@/utils/id';
import { startOfDay } from '@/utils/date';
import { BADGES_BY_ID } from '@/data/badges';

interface ProfileState {
  profile: UserProfile | null;
  settings: UserSettings | null;
  stats: CharacterStats | null;
  muscles: MuscleProgress[];
  badges: UserBadge[];
  /** Montée de niveau en attente d'animation (consommée par l'UI). */
  pendingLevelUp: LevelUpResult | null;

  load: () => Promise<void>;
  createProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;

  /** Ajoute de l'XP globale et détecte la montée de niveau. */
  addXp: (amount: number, source: string, refId?: string | null) => Promise<LevelUpResult>;
  /** Répartit l'XP d'un exercice entre ses muscles. */
  addMuscleXp: (exercise: Exercise, xp: number) => Promise<void>;
  setStats: (stats: CharacterStats) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<boolean>;
  consumeLevelUp: () => void;
  muscleLevel: (muscle: MuscleGroup) => { level: number; progress: number };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  settings: null,
  stats: null,
  muscles: [],
  badges: [],
  pendingLevelUp: null,

  load: async () => {
    const profile = await profileRepo.getProfile();
    if (!profile) return;
    const [settings, stats, muscles, badges] = await Promise.all([
      profileRepo.getSettings(profile.id),
      profileRepo.getCharacterStats(profile.id),
      profileRepo.getMuscleProgress(profile.id),
      profileRepo.getBadges(profile.id),
    ]);
    set({ profile, settings, stats, muscles, badges });
  },

  createProfile: async (profile) => {
    await profileRepo.upsertProfile(profile);
    const settings: UserSettings = {
      userId: profile.id,
      theme: 'dark',
      notificationsEnabled: true,
      units: profile.units,
      privacyShareStats: true,
    };
    const stats: CharacterStats = {
      strength: 5, endurance: 5, discipline: 5, power: 5, consistency: 5, recovery: 5,
    };
    await profileRepo.upsertSettings(settings);
    await profileRepo.upsertCharacterStats(profile.id, stats);
    set({ profile, settings, stats, muscles: [], badges: [] });
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    const next = { ...current, ...patch };
    await profileRepo.upsertProfile(next);
    set({ profile: next });
  },

  updateSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const next = { ...current, ...patch };
    await profileRepo.upsertSettings(next);
    set({ settings: next });
  },

  addXp: async (amount, source, refId = null) => {
    const profile = get().profile;
    if (!profile) throw new Error('Aucun profil.');
    const safeAmount = Math.max(0, Math.round(amount));
    const levelUp = computeLevelUp(profile.totalXp, safeAmount);

    const nextProfile: UserProfile = {
      ...profile,
      totalXp: profile.totalXp + safeAmount,
      level: levelUp.after.level,
    };
    await profileRepo.upsertProfile(nextProfile);
    await workoutRepo.addXpLog({
      id: uid('xp'),
      userId: profile.id,
      amount: safeAmount,
      source,
      refId,
      createdAt: Date.now(),
    });

    set({
      profile: nextProfile,
      pendingLevelUp: levelUp.leveledUp ? levelUp : get().pendingLevelUp,
    });

    // Débloque les badges liés aux récompenses de niveau.
    for (const reward of levelUp.rewards) {
      if (reward.badgeId) await get().unlockBadge(reward.badgeId);
    }
    return levelUp;
  },

  addMuscleXp: async (exercise, xp) => {
    const profile = get().profile;
    if (!profile) return;
    const distribution = distributeXpToMuscles(exercise, xp);
    const current = [...get().muscles];

    for (const [muscle, gain] of Object.entries(distribution) as [MuscleGroup, number][]) {
      const idx = current.findIndex((m) => m.muscle === muscle);
      const prevXp = idx >= 0 ? current[idx].xp : 0;
      const newXp = prevXp + gain;
      const level = resolveMuscleLevel(newXp).level;
      const entry: MuscleProgress = { userId: profile.id, muscle, xp: newXp, level };
      await profileRepo.upsertMuscleProgress(entry);
      if (idx >= 0) current[idx] = entry;
      else current.push(entry);
    }
    set({ muscles: current });
  },

  setStats: async (stats) => {
    const profile = get().profile;
    if (!profile) return;
    await profileRepo.upsertCharacterStats(profile.id, stats);
    set({ stats });
  },

  unlockBadge: async (badgeId) => {
    const profile = get().profile;
    if (!profile || !BADGES_BY_ID[badgeId]) return false;
    const unlocked = await profileRepo.unlockBadge(profile.id, badgeId);
    if (unlocked) {
      set({ badges: [...get().badges, { userId: profile.id, badgeId, unlockedAt: Date.now() }] });
    }
    return unlocked;
  },

  consumeLevelUp: () => set({ pendingLevelUp: null }),

  muscleLevel: (muscle) => {
    const m = get().muscles.find((x) => x.muscle === muscle);
    const state = resolveMuscleLevel(m?.xp ?? 0);
    return { level: state.level, progress: state.progress };
  },
}));

/** Sélecteur : état de niveau global dérivé. */
export function selectLevelState(profile: UserProfile | null) {
  return resolveLevel(profile?.totalXp ?? 0);
}

/** Détermine si aujourd'hui est un nouveau jour vs le dernier entraînement. */
export function isFirstWorkoutOfDay(profile: UserProfile | null): boolean {
  if (!profile?.lastWorkoutDate) return true;
  return startOfDay(profile.lastWorkoutDate) !== startOfDay(Date.now());
}
