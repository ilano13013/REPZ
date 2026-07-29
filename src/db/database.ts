/**
 * Service de base de données.
 *
 * Sélectionne l'implémentation selon la plateforme :
 *   - mobile  : `expo-sqlite` (module natif) ;
 *   - web     : `sql.js` via `webDatabase.ts` (SQLite compilé en JavaScript).
 *
 * Les deux respectent le contrat `AppDatabase`, si bien que les dépôts, les
 * stores et les écrans sont strictement identiques sur toutes les plateformes.
 *
 * Le choix se fait par IMPORT DYNAMIQUE : `expo-sqlite` n'est donc jamais
 * évalué dans le navigateur, où son module natif est absent.
 *
 * Les migrations sont communes et versionnées via `PRAGMA user_version`.
 */

import { Platform } from 'react-native';
import { DB_NAME } from '@/constants/config';
import { MIGRATIONS, LATEST_VERSION } from './schema';
import type { AppDatabase } from './types';

let db: AppDatabase | null = null;

/** Ouvre la base et applique les migrations en attente (idempotent). */
export async function initDatabase(): Promise<AppDatabase> {
  if (db) return db;

  if (Platform.OS === 'web') {
    const { openWebDatabase } = await import('./webDatabase');
    db = await openWebDatabase();
  } else {
    const SQLite = await import('expo-sqlite');
    const native = await SQLite.openDatabaseAsync(DB_NAME);
    await native.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    db = native as unknown as AppDatabase;
  }

  await runMigrations(db);
  return db;
}

async function runMigrations(database: AppDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      await database.execAsync(migration.up);
    }
  }

  if (LATEST_VERSION > current) {
    // PRAGMA n'accepte pas de paramètre lié : on injecte la valeur validée.
    await database.execAsync(`PRAGMA user_version = ${LATEST_VERSION};`);
  }
}

/** Retourne l'instance ouverte (lève une erreur si non initialisée). */
export function getDb(): AppDatabase {
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

export type { AppDatabase };
