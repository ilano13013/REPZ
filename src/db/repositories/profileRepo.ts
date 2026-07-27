/**
 * Dépôt : profil utilisateur, paramètres, stats de personnage, progression
 * musculaire et badges.
 */

import { getDb } from '../database';
import type {
  CharacterStats,
  MuscleGroup,
  MuscleProgress,
  UserBadge,
  UserProfile,
  UserSettings,
} from '@/models';

interface UserRow {
  id: string;
  name: string;
  age: number | null;
  sex: string;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: string;
  goal: string;
  sessions_per_week: number;
  available_days: string;
  location: string;
  equipment: string;
  limitations: string | null;
  units: string;
  created_at: number;
  total_xp: number;
  level: number;
  active_program_id: string | null;
  current_streak: number;
  best_streak: number;
  last_workout_date: number | null;
}

function rowToProfile(r: UserRow): UserProfile {
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    sex: r.sex as UserProfile['sex'],
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    fitnessLevel: r.fitness_level as UserProfile['fitnessLevel'],
    goal: r.goal as UserProfile['goal'],
    sessionsPerWeek: r.sessions_per_week,
    availableDays: JSON.parse(r.available_days),
    location: r.location as UserProfile['location'],
    equipment: JSON.parse(r.equipment),
    limitations: r.limitations,
    units: r.units as UserProfile['units'],
    createdAt: r.created_at,
    totalXp: r.total_xp,
    level: r.level,
    activeProgramId: r.active_program_id,
    currentStreak: r.current_streak,
    bestStreak: r.best_streak,
    lastWorkoutDate: r.last_workout_date,
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const row = await getDb().getFirstAsync<UserRow>('SELECT * FROM users LIMIT 1;');
  return row ? rowToProfile(row) : null;
}

export async function upsertProfile(p: UserProfile): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO users (id, name, age, sex, height_cm, weight_kg, fitness_level, goal,
       sessions_per_week, available_days, location, equipment, limitations, units,
       created_at, total_xp, level, active_program_id, current_streak, best_streak, last_workout_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, age=excluded.age, sex=excluded.sex, height_cm=excluded.height_cm,
       weight_kg=excluded.weight_kg, fitness_level=excluded.fitness_level, goal=excluded.goal,
       sessions_per_week=excluded.sessions_per_week, available_days=excluded.available_days,
       location=excluded.location, equipment=excluded.equipment, limitations=excluded.limitations,
       units=excluded.units, total_xp=excluded.total_xp, level=excluded.level,
       active_program_id=excluded.active_program_id, current_streak=excluded.current_streak,
       best_streak=excluded.best_streak, last_workout_date=excluded.last_workout_date;`,
    [
      p.id, p.name, p.age, p.sex, p.heightCm, p.weightKg, p.fitnessLevel, p.goal,
      p.sessionsPerWeek, JSON.stringify(p.availableDays), p.location,
      JSON.stringify(p.equipment), p.limitations, p.units, p.createdAt, p.totalXp,
      p.level, p.activeProgramId, p.currentStreak, p.bestStreak, p.lastWorkoutDate,
    ],
  );
}

// ------------------------------------------------------------------- Settings

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const row = await getDb().getFirstAsync<{
    user_id: string;
    theme: string;
    notifications_enabled: number;
    units: string;
    privacy_share_stats: number;
  }>('SELECT * FROM settings WHERE user_id = ?;', [userId]);
  if (!row) return null;
  return {
    userId: row.user_id,
    theme: row.theme as UserSettings['theme'],
    notificationsEnabled: !!row.notifications_enabled,
    units: row.units as UserSettings['units'],
    privacyShareStats: !!row.privacy_share_stats,
  };
}

export async function upsertSettings(s: UserSettings): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO settings (user_id, theme, notifications_enabled, units, privacy_share_stats)
     VALUES (?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       theme=excluded.theme, notifications_enabled=excluded.notifications_enabled,
       units=excluded.units, privacy_share_stats=excluded.privacy_share_stats;`,
    [s.userId, s.theme, s.notificationsEnabled ? 1 : 0, s.units, s.privacyShareStats ? 1 : 0],
  );
}

// ------------------------------------------------------------ Character stats

export async function getCharacterStats(userId: string): Promise<CharacterStats | null> {
  const row = await getDb().getFirstAsync<CharacterStats & { user_id: string }>(
    'SELECT * FROM character_stats WHERE user_id = ?;',
    [userId],
  );
  if (!row) return null;
  return {
    strength: row.strength,
    endurance: row.endurance,
    discipline: row.discipline,
    power: row.power,
    consistency: row.consistency,
    recovery: row.recovery,
  };
}

export async function upsertCharacterStats(userId: string, s: CharacterStats): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO character_stats (user_id, strength, endurance, discipline, power, consistency, recovery)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       strength=excluded.strength, endurance=excluded.endurance, discipline=excluded.discipline,
       power=excluded.power, consistency=excluded.consistency, recovery=excluded.recovery;`,
    [userId, s.strength, s.endurance, s.discipline, s.power, s.consistency, s.recovery],
  );
}

// --------------------------------------------------------- Muscle progression

export async function getMuscleProgress(userId: string): Promise<MuscleProgress[]> {
  const rows = await getDb().getAllAsync<{
    user_id: string;
    muscle: string;
    xp: number;
    level: number;
  }>('SELECT * FROM muscle_progress WHERE user_id = ?;', [userId]);
  return rows.map((r) => ({
    userId: r.user_id,
    muscle: r.muscle as MuscleGroup,
    xp: r.xp,
    level: r.level,
  }));
}

export async function upsertMuscleProgress(m: MuscleProgress): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO muscle_progress (user_id, muscle, xp, level) VALUES (?,?,?,?)
     ON CONFLICT(user_id, muscle) DO UPDATE SET xp=excluded.xp, level=excluded.level;`,
    [m.userId, m.muscle, m.xp, m.level],
  );
}

// ------------------------------------------------------------------- Badges

export async function getBadges(userId: string): Promise<UserBadge[]> {
  const rows = await getDb().getAllAsync<{
    user_id: string;
    badge_id: string;
    unlocked_at: number;
  }>('SELECT * FROM user_badges WHERE user_id = ?;', [userId]);
  return rows.map((r) => ({ userId: r.user_id, badgeId: r.badge_id, unlockedAt: r.unlocked_at }));
}

export async function unlockBadge(userId: string, badgeId: string): Promise<boolean> {
  const result = await getDb().runAsync(
    `INSERT OR IGNORE INTO user_badges (user_id, badge_id, unlocked_at) VALUES (?,?,?);`,
    [userId, badgeId, Date.now()],
  );
  return result.changes > 0;
}
