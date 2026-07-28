/**
 * Dépôt : programmes personnalisés (stockés sérialisés en JSON).
 * Les programmes prédéfinis restent des constantes de code (`src/data`).
 */

import { getDb } from '../database';
import type { Program } from '@/models';

export async function listCustomPrograms(userId: string): Promise<Program[]> {
  const rows = await getDb().getAllAsync<{ id: string; user_id: string; data: string }>(
    'SELECT * FROM custom_programs WHERE user_id = ?;',
    [userId],
  );
  return rows.map((r) => JSON.parse(r.data) as Program);
}

export async function saveCustomProgram(userId: string, program: Program): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO custom_programs (id, user_id, data) VALUES (?,?,?)
     ON CONFLICT(id) DO UPDATE SET data=excluded.data;`,
    [program.id, userId, JSON.stringify(program)],
  );
}

export async function deleteCustomProgram(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM custom_programs WHERE id = ?;', [id]);
}
