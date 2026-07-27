/**
 * Couche de synchronisation — PRÉPARÉE mais DÉSACTIVÉE dans cette version.
 *
 * L'architecture définit les interfaces d'authentification, de stockage cloud,
 * de classement et de défis communautaires afin qu'une implémentation en ligne
 * puisse être branchée plus tard sans réécrire l'app. Une implémentation locale
 * « no-op » est fournie par défaut.
 *
 * Voir `FEATURE_FLAGS` dans `src/constants/config.ts`.
 */

import type { LeagueMember, UserProfile } from '@/models';

export interface AuthProvider {
  signIn(email: string, password: string): Promise<{ userId: string }>;
  signOut(): Promise<void>;
  getCurrentUserId(): string | null;
}

export interface CloudStorage {
  /** Pousse un instantané local vers le cloud. */
  push(userId: string, snapshot: unknown): Promise<void>;
  /** Récupère l'instantané distant. */
  pull(userId: string): Promise<unknown | null>;
  /** Résout un conflit de synchronisation (dernier gagne par défaut). */
  resolve(local: unknown, remote: unknown): unknown;
}

export interface OnlineLeaderboard {
  fetchDivision(division: string): Promise<LeagueMember[]>;
  submitScore(userId: string, score: number): Promise<void>;
}

export interface FriendsService {
  listFriends(userId: string): Promise<UserProfile[]>;
  sendChallenge(fromUserId: string, toUserId: string, questId: string): Promise<void>;
}

/** Implémentation locale par défaut (aucune opération réseau). */
export const localAuth: AuthProvider = {
  async signIn() {
    throw new Error('Authentification non disponible dans la version locale.');
  },
  async signOut() {
    /* no-op */
  },
  getCurrentUserId() {
    return null;
  },
};

export const noopCloud: CloudStorage = {
  async push() {
    /* no-op : stockage 100 % local */
  },
  async pull() {
    return null;
  },
  resolve(local) {
    return local;
  },
};
