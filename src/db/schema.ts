/**
 * Schéma SQLite et migrations.
 *
 * Les catalogues statiques (exercices, programmes, quêtes, badges, titres,
 * niveaux) vivent dans `src/data` en tant que constantes typées : la base de
 * données ne stocke que les données DYNAMIQUES de l'utilisateur.
 *
 * Le système de migrations est versionné via `PRAGMA user_version`.
 */

export interface Migration {
  version: number;
  up: string;
}

/**
 * Migrations appliquées séquentiellement. Pour faire évoluer le schéma,
 * AJOUTER une nouvelle migration (ne jamais modifier une migration existante).
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      age INTEGER,
      sex TEXT NOT NULL DEFAULT 'unspecified',
      height_cm REAL,
      weight_kg REAL,
      fitness_level TEXT NOT NULL DEFAULT 'beginner',
      goal TEXT NOT NULL DEFAULT 'general_fitness',
      sessions_per_week INTEGER NOT NULL DEFAULT 3,
      available_days TEXT NOT NULL DEFAULT '[]',
      location TEXT NOT NULL DEFAULT 'gym',
      equipment TEXT NOT NULL DEFAULT '[]',
      limitations TEXT,
      units TEXT NOT NULL DEFAULT 'kg',
      created_at INTEGER NOT NULL,
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      active_program_id TEXT,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      last_workout_date INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY NOT NULL,
      theme TEXT NOT NULL DEFAULT 'dark',
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      units TEXT NOT NULL DEFAULT 'kg',
      privacy_share_stats INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS custom_programs (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      program_id TEXT,
      program_day_id TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      note TEXT,
      total_xp INTEGER NOT NULL DEFAULT 0,
      total_volume_kg REAL NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id, started_at);

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      ord INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      skipped INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_we_workout ON workout_exercises(workout_id);

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      workout_exercise_id TEXT NOT NULL,
      ord INTEGER NOT NULL DEFAULT 0,
      weight_kg REAL,
      reps INTEGER,
      duration_sec INTEGER,
      distance_m REAL,
      rpe REAL,
      completed INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      is_personal_record INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sets_we ON sets(workout_exercise_id);

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      context REAL,
      achieved_at INTEGER NOT NULL,
      workout_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pr_user_ex ON personal_records(user_id, exercise_id, type);

    CREATE TABLE IF NOT EXISTS xp_log (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      ref_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_log(user_id, created_at);

    CREATE TABLE IF NOT EXISTS muscle_progress (
      user_id TEXT NOT NULL,
      muscle TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, muscle)
    );

    CREATE TABLE IF NOT EXISTS character_stats (
      user_id TEXT PRIMARY KEY NOT NULL,
      strength REAL NOT NULL DEFAULT 5,
      endurance REAL NOT NULL DEFAULT 5,
      discipline REAL NOT NULL DEFAULT 5,
      power REAL NOT NULL DEFAULT 5,
      consistency REAL NOT NULL DEFAULT 5,
      recovery REAL NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS user_quests (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      period TEXT NOT NULL,
      period_key TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      target REAL NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_uq_user_period ON user_quests(user_id, period, period_key);

    CREATE TABLE IF NOT EXISTS boss (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      week_key TEXT NOT NULL,
      name TEXT NOT NULL,
      metric TEXT NOT NULL,
      target REAL NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      defeated INTEGER NOT NULL DEFAULT 0,
      reward_xp INTEGER NOT NULL DEFAULT 0,
      starts_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_boss_user_week ON boss(user_id, week_key);

    CREATE TABLE IF NOT EXISTS user_badges (
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      date INTEGER NOT NULL,
      arm_cm REAL, chest_cm REAL, waist_cm REAL, hips_cm REAL,
      thigh_cm REAL, calf_cm REAL, body_fat_pct REAL, photo_uri TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_meas_user ON measurements(user_id, date);

    CREATE TABLE IF NOT EXISTS body_weight (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      date INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bw_user ON body_weight(user_id, date);

    CREATE TABLE IF NOT EXISTS recovery_checkins (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      date INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      sleep_quality INTEGER NOT NULL,
      soreness INTEGER NOT NULL,
      motivation INTEGER NOT NULL,
      pain INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_checkin_user ON recovery_checkins(user_id, date);

    CREATE TABLE IF NOT EXISTS league_members (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_user INTEGER NOT NULL DEFAULT 0,
      score REAL NOT NULL DEFAULT 0,
      division TEXT NOT NULL DEFAULT 'iron'
    );
    `,
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
