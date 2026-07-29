/**
 * Implémentation web de la couche base de données.
 *
 * Metro sélectionne automatiquement ce fichier à la place de `database.ts`
 * lorsque la plateforme est le web (résolution des extensions `.web.ts`).
 *
 * `expo-sqlite` repose sur un module natif indisponible dans le navigateur.
 * On utilise donc `sql.js` — SQLite compilé en JavaScript — qui offre le même
 * moteur SQL : les requêtes des dépôts fonctionnent sans modification.
 * La base vit en mémoire et est sauvegardée dans le `localStorage` après
 * chaque écriture, ce qui préserve les données entre deux rechargements.
 */

// @ts-expect-error — build JavaScript pur de sql.js, sans typage fourni.
import initSqlJs from 'sql.js/dist/sql-asm.js';
import { DB_NAME } from '@/constants/config';
import { MIGRATIONS, LATEST_VERSION } from './schema';

const STORAGE_KEY = `repz.sqlite.${DB_NAME}`;

type SqlValue = string | number | null | Uint8Array;

/** Sous-ensemble de l'API sql.js réellement utilisé. */
interface SqlJsDatabase {
  run(sql: string, params?: SqlValue[]): void;
  exec(sql: string, params?: SqlValue[]): { columns: string[]; values: SqlValue[][] }[];
  prepare(sql: string): SqlJsStatement;
  getRowsModified(): number;
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: SqlValue[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, SqlValue>;
  free(): void;
}

/**
 * Adaptateur exposant la même API que `SQLiteDatabase` d'expo-sqlite, afin que
 * les dépôts soient identiques sur mobile et sur le web.
 */
export interface AppDatabase {
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  runAsync(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

let raw: SqlJsDatabase | null = null;
let adapter: AppDatabase | null = null;

// ---------------------------------------------------------------------------
// Persistance dans le localStorage
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // évite de dépasser la taille d'appel de String.fromCharCode
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Sauvegarde différée : évite d'écrire à chaque requête d'une transaction. */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!raw) return;
    try {
      localStorage.setItem(STORAGE_KEY, toBase64(raw.export()));
    } catch (e) {
      // Quota dépassé ou stockage indisponible : l'app continue en mémoire.
      console.warn('Sauvegarde locale impossible', e);
    }
  }, 300);
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/** Ouvre la base (restaurée si une sauvegarde existe) et applique les migrations. */
export async function initDatabase(): Promise<AppDatabase> {
  if (adapter) return adapter;

  const SQL = await initSqlJs();

  let restored: Uint8Array | undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) restored = fromBase64(stored);
  } catch {
    // Stockage inaccessible : on démarre sur une base vierge.
  }

  raw = restored ? new SQL.Database(restored) : new SQL.Database();
  raw!.run('PRAGMA foreign_keys = ON;');

  adapter = createAdapter(raw!);
  await runMigrations(adapter);
  scheduleSave();
  return adapter;
}

function createAdapter(db: SqlJsDatabase): AppDatabase {
  return {
    async getFirstAsync<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        return stmt.step() ? (stmt.getAsObject() as T) : null;
      } finally {
        stmt.free();
      }
    },

    async getAllAsync<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      const rows: T[] = [];
      try {
        stmt.bind(params);
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
      } finally {
        stmt.free();
      }
      return rows;
    },

    async runAsync(sql: string, params: SqlValue[] = []): Promise<{ changes: number }> {
      db.run(sql, params);
      scheduleSave();
      return { changes: db.getRowsModified() };
    },

    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
      scheduleSave();
    },

    async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
      db.run('BEGIN;');
      try {
        await fn();
        db.run('COMMIT;');
        scheduleSave();
      } catch (e) {
        db.run('ROLLBACK;');
        throw e;
      }
    },
  };
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
    await database.execAsync(`PRAGMA user_version = ${LATEST_VERSION};`);
  }
}

/** Retourne l'instance ouverte (lève une erreur si non initialisée). */
export function getDb(): AppDatabase {
  if (!adapter) {
    throw new Error('Base de données non initialisée. Appelez initDatabase() d\'abord.');
  }
  return adapter;
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
