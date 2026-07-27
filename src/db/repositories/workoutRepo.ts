/**
 * Dépôt : séances (avec exercices et séries), records personnels, journal d'XP.
 */

import { getDb } from '../database';
import type {
  PersonalRecord,
  PersonalRecordType,
  SetEntry,
  Workout,
  WorkoutExercise,
  XpLogEntry,
} from '@/models';

// --------------------------------------------------------------- Séances

export async function saveWorkout(w: Workout): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO workouts (id, user_id, program_id, program_day_id, name, status,
         started_at, completed_at, note, total_xp, total_volume_kg)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         status=excluded.status, completed_at=excluded.completed_at, note=excluded.note,
         total_xp=excluded.total_xp, total_volume_kg=excluded.total_volume_kg;`,
      [w.id, w.userId, w.programId, w.programDayId, w.name, w.status, w.startedAt,
       w.completedAt, w.note, w.totalXp, w.totalVolumeKg],
    );
    // On réécrit les exercices/séries pour simplifier la persistance.
    const existing = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM workout_exercises WHERE workout_id = ?;',
      [w.id],
    );
    for (const e of existing) {
      await db.runAsync('DELETE FROM sets WHERE workout_exercise_id = ?;', [e.id]);
    }
    await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?;', [w.id]);

    for (const we of w.exercises) {
      await db.runAsync(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, ord, note, skipped)
         VALUES (?,?,?,?,?,?);`,
        [we.id, we.workoutId, we.exerciseId, we.order, we.note, we.skipped ? 1 : 0],
      );
      for (const s of we.sets) {
        await db.runAsync(
          `INSERT INTO sets (id, workout_exercise_id, ord, weight_kg, reps, duration_sec,
             distance_m, rpe, completed, xp_earned, is_personal_record)
           VALUES (?,?,?,?,?,?,?,?,?,?,?);`,
          [s.id, s.workoutExerciseId, s.order, s.weightKg, s.reps, s.durationSec,
           s.distanceM, s.rpe, s.completed ? 1 : 0, s.xpEarned, s.isPersonalRecord ? 1 : 0],
        );
      }
    }
  });
}

interface WorkoutRow {
  id: string;
  user_id: string;
  program_id: string | null;
  program_day_id: string | null;
  name: string;
  status: string;
  started_at: number;
  completed_at: number | null;
  note: string | null;
  total_xp: number;
  total_volume_kg: number;
}

async function hydrateWorkout(row: WorkoutRow): Promise<Workout> {
  const db = getDb();
  const wes = await db.getAllAsync<{
    id: string; workout_id: string; exercise_id: string; ord: number;
    note: string | null; skipped: number;
  }>('SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY ord;', [row.id]);

  const exercises: WorkoutExercise[] = [];
  for (const we of wes) {
    const sets = await db.getAllAsync<{
      id: string; workout_exercise_id: string; ord: number; weight_kg: number | null;
      reps: number | null; duration_sec: number | null; distance_m: number | null;
      rpe: number | null; completed: number; xp_earned: number; is_personal_record: number;
    }>('SELECT * FROM sets WHERE workout_exercise_id = ? ORDER BY ord;', [we.id]);

    exercises.push({
      id: we.id,
      workoutId: we.workout_id,
      exerciseId: we.exercise_id,
      order: we.ord,
      note: we.note,
      skipped: !!we.skipped,
      sets: sets.map<SetEntry>((s) => ({
        id: s.id,
        workoutExerciseId: s.workout_exercise_id,
        order: s.ord,
        weightKg: s.weight_kg,
        reps: s.reps,
        durationSec: s.duration_sec,
        distanceM: s.distance_m,
        rpe: s.rpe,
        completed: !!s.completed,
        xpEarned: s.xp_earned,
        isPersonalRecord: !!s.is_personal_record,
      })),
    });
  }

  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    programDayId: row.program_day_id,
    name: row.name,
    status: row.status as Workout['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    note: row.note,
    totalXp: row.total_xp,
    totalVolumeKg: row.total_volume_kg,
    exercises,
  };
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const row = await getDb().getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?;', [id]);
  return row ? hydrateWorkout(row) : null;
}

export async function listWorkouts(userId: string, limit = 50): Promise<Workout[]> {
  const rows = await getDb().getAllAsync<WorkoutRow>(
    'SELECT * FROM workouts WHERE user_id = ? AND status = ? ORDER BY started_at DESC LIMIT ?;',
    [userId, 'completed', limit],
  );
  return Promise.all(rows.map(hydrateWorkout));
}

// --------------------------------------------------------- Records personnels

export async function listRecords(userId: string): Promise<PersonalRecord[]> {
  const rows = await getDb().getAllAsync<{
    id: string; user_id: string; exercise_id: string; type: string; value: number;
    context: number | null; achieved_at: number; workout_id: string | null;
  }>('SELECT * FROM personal_records WHERE user_id = ? ORDER BY achieved_at DESC;', [userId]);
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    exerciseId: r.exercise_id,
    type: r.type as PersonalRecordType,
    value: r.value,
    context: r.context,
    achievedAt: r.achieved_at,
    workoutId: r.workout_id,
  }));
}

export async function upsertRecord(r: PersonalRecord): Promise<void> {
  const db = getDb();
  // Un seul record par (user, exercice, type[, contexte]).
  await db.runAsync(
    `DELETE FROM personal_records WHERE user_id = ? AND exercise_id = ? AND type = ?
       AND (context IS ? OR context = ?);`,
    [r.userId, r.exerciseId, r.type, r.context, r.context],
  );
  await db.runAsync(
    `INSERT INTO personal_records (id, user_id, exercise_id, type, value, context, achieved_at, workout_id)
     VALUES (?,?,?,?,?,?,?,?);`,
    [r.id, r.userId, r.exerciseId, r.type, r.value, r.context, r.achievedAt, r.workoutId],
  );
}

// ------------------------------------------------------------------ Journal XP

export async function addXpLog(entry: XpLogEntry): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO xp_log (id, user_id, amount, source, ref_id, created_at) VALUES (?,?,?,?,?,?);`,
    [entry.id, entry.userId, entry.amount, entry.source, entry.refId, entry.createdAt],
  );
}

export async function sumXpToday(userId: string, dayStart: number, dayEnd: number): Promise<number> {
  const row = await getDb().getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM xp_log WHERE user_id = ? AND created_at BETWEEN ? AND ?;',
    [userId, dayStart, dayEnd],
  );
  return row?.total ?? 0;
}
