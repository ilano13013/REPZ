/**
 * Service de base de données SQLite (expo-sqlite).
 *
 * Ouvre la base, exécute les migrations en attente selon `PRAGMA user_version`
 * et expose une instance partagée. Toutes les opérations sont asynchrones.
 */

import type * as SQLiteTypes from 'expo-sqlite';
import { DB_NAME } from '@/constants/config';
import { MIGRATIONS, LATEST_VERSION } from './schema';

let db: SQLiteTypes.SQLiteDatabase | null = null;

/**
 * Chargement différé d'expo-sqlite.
 *
 * Sur le web, le module natif n'est disponible qu'une fois le moteur
 * WebAssembly résolu : un import statique ferait échouer toute l'application au
 * chargement. En important à la demande, l'erreur reste rattrapable par
 * l'appelant.
 */
async function loadSQLite(): Promise<typeof SQLiteTypes> {
  return import('expo-sqlite');
}

/** Ouvre la base et applique les migrations (idempotent). */
export async function initDatabase(): Promise<SQLiteTypes.SQLiteDatabase> {
  if (db) return db;
  const SQLite = await loadSQLite();
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLiteTypes.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      await database.withTransactionAsync(async () => {
        await database.execAsync(migration.up);
      });
    }
  }
  if (LATEST_VERSION > current) {
    // PRAGMA n'accepte pas de paramètre lié : on injecte la valeur validée.
    await database.execAsync(`PRAGMA user_version = ${LATEST_VERSION};`);
  }
}

/** Retourne l'instance ouverte (lève une erreur si non initialisée). */
export function getDb(): SQLiteTypes.SQLiteDatabase {
  if (!db) {
    throw new Error('Base de données non initialisée. Appelez initDatabase() d\'abord.');
  }
  return db;
}

/** Réinitialise complètement la base (suppression de toutes les données). */
export async function resetDatabase(): Promise<void> {
  const database = getDb();
  const tables = [
    'users', 'settings', 'custom_programs', 'workouts', 'workout_exercises',
    'sets', 'personal_records', 'xp_log', 'muscle_progress', 'character_stats',
    'user_quests', 'boss', 'user_badges', 'measurements', 'body_weight',
    'recovery_checkins', 'league_members',
  ];
  await database.withTransactionAsync(async () => {
    for (const t of tables) {
      await database.execAsync(`DELETE FROM ${t};`);
    }
  });
}
