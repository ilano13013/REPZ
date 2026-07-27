/**
 * Dépôt : poids de corps, mensurations, check-ins de récupération.
 */

import { getDb } from '../database';
import type { BodyWeightEntry, MeasurementEntry, RecoveryCheckin } from '@/models';

// ------------------------------------------------------------ Poids de corps

export async function addBodyWeight(e: BodyWeightEntry): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO body_weight (id, user_id, weight_kg, date) VALUES (?,?,?,?);`,
    [e.id, e.userId, e.weightKg, e.date],
  );
}

export async function listBodyWeight(userId: string): Promise<BodyWeightEntry[]> {
  const rows = await getDb().getAllAsync<{
    id: string; user_id: string; weight_kg: number; date: number;
  }>('SELECT * FROM body_weight WHERE user_id = ? ORDER BY date ASC;', [userId]);
  return rows.map((r) => ({ id: r.id, userId: r.user_id, weightKg: r.weight_kg, date: r.date }));
}

// ------------------------------------------------------------- Mensurations

export async function addMeasurement(m: MeasurementEntry): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO measurements (id, user_id, date, arm_cm, chest_cm, waist_cm, hips_cm,
       thigh_cm, calf_cm, body_fat_pct, photo_uri)
     VALUES (?,?,?,?,?,?,?,?,?,?,?);`,
    [m.id, m.userId, m.date, m.armCm, m.chestCm, m.waistCm, m.hipsCm, m.thighCm,
     m.calfCm, m.bodyFatPct, m.photoUri],
  );
}

export async function listMeasurements(userId: string): Promise<MeasurementEntry[]> {
  const rows = await getDb().getAllAsync<{
    id: string; user_id: string; date: number; arm_cm: number | null; chest_cm: number | null;
    waist_cm: number | null; hips_cm: number | null; thigh_cm: number | null;
    calf_cm: number | null; body_fat_pct: number | null; photo_uri: string | null;
  }>('SELECT * FROM measurements WHERE user_id = ? ORDER BY date ASC;', [userId]);
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    armCm: r.arm_cm,
    chestCm: r.chest_cm,
    waistCm: r.waist_cm,
    hipsCm: r.hips_cm,
    thighCm: r.thigh_cm,
    calfCm: r.calf_cm,
    bodyFatPct: r.body_fat_pct,
    photoUri: r.photo_uri,
  }));
}

// ----------------------------------------------------------------- Check-ins

export async function addCheckin(c: RecoveryCheckin): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO recovery_checkins (id, user_id, date, energy, sleep_quality, soreness, motivation, pain)
     VALUES (?,?,?,?,?,?,?,?);`,
    [c.id, c.userId, c.date, c.energy, c.sleepQuality, c.soreness, c.motivation, c.pain ? 1 : 0],
  );
}

export async function listCheckins(userId: string, limit = 30): Promise<RecoveryCheckin[]> {
  const rows = await getDb().getAllAsync<{
    id: string; user_id: string; date: number; energy: number; sleep_quality: number;
    soreness: number; motivation: number; pain: number;
  }>('SELECT * FROM recovery_checkins WHERE user_id = ? ORDER BY date DESC LIMIT ?;', [userId, limit]);
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    energy: r.energy,
    sleepQuality: r.sleep_quality,
    soreness: r.soreness,
    motivation: r.motivation,
    pain: !!r.pain,
  }));
}
