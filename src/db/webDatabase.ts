/**
 * Implémentation navigateur de la base de données.
 *
 * `expo-sqlite` repose sur un module natif indisponible dans le navigateur.
 * On utilise ici `sql.js` — le moteur SQLite compilé en JavaScript — qui offre
 * le même dialecte SQL : les requêtes des dépôts fonctionnent sans adaptation.
 *
 * Ce module n'est chargé que lorsque la plateforme est le web (import dynamique
 * depuis `database.ts`), afin de ne peser ni sur le bundle natif ni sur son
 * démarrage.
 *
 * La base vit en mémoire et est sauvegardée dans le `localStorage` après chaque
 * écriture, ce qui préserve les données entre deux rechargements.
 */

// @ts-expect-error — build JavaScript pur de sql.js, livré sans typage.
import initSqlJs from 'sql.js/dist/sql-asm.js';
import { DB_NAME } from '@/constants/config';
import type { AppDatabase, SqlValue } from './types';

const STORAGE_KEY = `repz.sqlite.${DB_NAME}`;

/** Sous-ensemble de l'API sql.js réellement utilisé. */
interface SqlJsDatabase {
  run(sql: string, params?: SqlValue[]): void;
  exec(sql: string): unknown;
  prepare(sql: string): SqlJsStatement;
  getRowsModified(): number;
  export(): Uint8Array;
}

interface SqlJsStatement {
  bind(params?: SqlValue[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, SqlValue>;
  free(): void;
}

// ---------------------------------------------------------------------------
// Persistance dans le localStorage
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // borne la taille des appels à String.fromCharCode
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

/** Sauvegarde différée : évite d'exporter la base à chaque requête. */
function createSaver(db: SqlJsDatabase): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, toBase64(db.export()));
      } catch (e) {
        // Quota dépassé ou stockage bloqué : l'application continue en mémoire.
        console.warn('Sauvegarde locale impossible', e);
      }
    }, 300);
  };
}

// ---------------------------------------------------------------------------
// Ouverture
// ---------------------------------------------------------------------------

/** Ouvre la base web, restaurée depuis le localStorage si une sauvegarde existe. */
export async function openWebDatabase(): Promise<AppDatabase> {
  const SQL = await initSqlJs();

  let restored: Uint8Array | undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) restored = fromBase64(stored);
  } catch {
    // Stockage inaccessible : on démarre sur une base vierge.
  }

  const db: SqlJsDatabase = restored ? new SQL.Database(restored) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  const save = createSaver(db);

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
      save();
      return { changes: db.getRowsModified() };
    },

    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
      save();
    },

    async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
      db.run('BEGIN;');
      try {
        await fn();
        db.run('COMMIT;');
        save();
      } catch (e) {
        db.run('ROLLBACK;');
        throw e;
      }
    },
  };
}
