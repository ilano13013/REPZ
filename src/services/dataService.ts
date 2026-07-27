/**
 * Service de gestion des données locales : export/import JSON, réinitialisation,
 * chargement du mode démonstration.
 *
 * Toutes les données restent sur l'appareil (aucune transmission réseau).
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb, resetDatabase } from '@/db/database';
import { seedDemo } from '@/db/demo';
import { useProfileStore } from '@/stores/profileStore';
import { useGameStore } from '@/stores/gameStore';

const EXPORT_TABLES = [
  'users', 'settings', 'custom_programs', 'workouts', 'workout_exercises', 'sets',
  'personal_records', 'xp_log', 'muscle_progress', 'character_stats', 'user_quests',
  'boss', 'user_badges', 'measurements', 'body_weight', 'recovery_checkins', 'league_members',
];

export interface Snapshot {
  version: number;
  exportedAt: number;
  tables: Record<string, unknown[]>;
}

/** Construit un instantané complet de la base. */
export async function buildSnapshot(): Promise<Snapshot> {
  const db = getDb();
  const tables: Record<string, unknown[]> = {};
  for (const t of EXPORT_TABLES) {
    tables[t] = await db.getAllAsync(`SELECT * FROM ${t};`);
  }
  return { version: 1, exportedAt: Date.now(), tables };
}

/** Exporte les données au format JSON et propose le partage du fichier. */
export async function exportData(): Promise<void> {
  const snapshot = await buildSnapshot();
  const json = JSON.stringify(snapshot, null, 2);
  const uri = `${FileSystem.documentDirectory}repz-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json' });
  }
}

/** Restaure la base depuis un instantané (remplace les données existantes). */
export async function restoreSnapshot(snapshot: Snapshot): Promise<void> {
  const db = getDb();
  await resetDatabase();
  await db.withTransactionAsync(async () => {
    for (const [table, rows] of Object.entries(snapshot.tables)) {
      if (!EXPORT_TABLES.includes(table)) continue;
      for (const row of rows as Record<string, unknown>[]) {
        const cols = Object.keys(row);
        if (cols.length === 0) continue;
        const placeholders = cols.map(() => '?').join(',');
        await db.runAsync(
          `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders});`,
          cols.map((c) => row[c] as never),
        );
      }
    }
  });
}

/** Sélectionne un fichier JSON et importe la sauvegarde. */
export async function importData(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (result.canceled || !result.assets?.[0]) return false;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const snapshot = JSON.parse(content) as Snapshot;
  await restoreSnapshot(snapshot);
  await reloadStores();
  return true;
}

/** Charge le mode démonstration puis recharge les stores. */
export async function loadDemo(): Promise<void> {
  await seedDemo();
  await reloadStores();
}

/** Réinitialise toutes les données locales. */
export async function resetAll(): Promise<void> {
  await resetDatabase();
  await reloadStores();
}

async function reloadStores(): Promise<void> {
  await useProfileStore.getState().load();
  if (useProfileStore.getState().profile) {
    await useGameStore.getState().load();
  }
}
