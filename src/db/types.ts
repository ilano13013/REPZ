/**
 * Contrat commun aux implémentations de base de données.
 *
 * Reprend le sous-ensemble de l'API `SQLiteDatabase` d'expo-sqlite réellement
 * utilisé par les dépôts, afin que l'implémentation native et l'implémentation
 * web soient interchangeables.
 */

export type SqlValue = string | number | null | Uint8Array;

export interface AppDatabase {
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  runAsync(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}
