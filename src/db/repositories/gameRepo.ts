/**
 * Dépôt : quêtes utilisateur, boss hebdomadaire, membres de ligue.
 */

import { getDb } from '../database';
import type { LeagueDivision, LeagueMember, UserQuest, WeeklyBoss } from '@/models';

// --------------------------------------------------------------- Quêtes

export async function getUserQuests(
  userId: string,
  period: 'daily' | 'weekly',
  periodKey: string,
): Promise<UserQuest[]> {
  const rows = await getDb().getAllAsync<{
    id: string; user_id: string; quest_id: string; period: string; period_key: string;
    progress: number; target: number; completed: number; claimed: number;
  }>(
    'SELECT * FROM user_quests WHERE user_id = ? AND period = ? AND period_key = ?;',
    [userId, period, periodKey],
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    questId: r.quest_id,
    period: r.period as UserQuest['period'],
    periodKey: r.period_key,
    progress: r.progress,
    target: r.target,
    completed: !!r.completed,
    claimed: !!r.claimed,
  }));
}

export async function upsertUserQuest(q: UserQuest): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO user_quests (id, user_id, quest_id, period, period_key, progress, target, completed, claimed)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       progress=excluded.progress, completed=excluded.completed, claimed=excluded.claimed;`,
    [q.id, q.userId, q.questId, q.period, q.periodKey, q.progress, q.target,
     q.completed ? 1 : 0, q.claimed ? 1 : 0],
  );
}

// ----------------------------------------------------------------- Boss

export async function getBoss(userId: string, weekKey: string): Promise<WeeklyBoss | null> {
  const row = await getDb().getFirstAsync<{
    id: string; user_id: string; week_key: string; name: string; metric: string;
    target: number; progress: number; defeated: number; reward_xp: number;
    starts_at: number; ends_at: number;
  }>('SELECT * FROM boss WHERE user_id = ? AND week_key = ?;', [userId, weekKey]);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    weekKey: row.week_key,
    name: row.name,
    metric: row.metric as WeeklyBoss['metric'],
    target: row.target,
    progress: row.progress,
    defeated: !!row.defeated,
    rewardXp: row.reward_xp,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export async function upsertBoss(b: WeeklyBoss): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO boss (id, user_id, week_key, name, metric, target, progress, defeated, reward_xp, starts_at, ends_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET progress=excluded.progress, defeated=excluded.defeated;`,
    [b.id, b.userId, b.weekKey, b.name, b.metric, b.target, b.progress,
     b.defeated ? 1 : 0, b.rewardXp, b.startsAt, b.endsAt],
  );
}

// ----------------------------------------------------------------- Ligue

export async function getLeague(): Promise<LeagueMember[]> {
  const rows = await getDb().getAllAsync<{
    id: string; name: string; is_user: number; score: number; division: string;
  }>('SELECT * FROM league_members ORDER BY score DESC;');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    isUser: !!r.is_user,
    score: r.score,
    division: r.division as LeagueDivision,
  }));
}

export async function replaceLeague(members: LeagueMember[]): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM league_members;');
    for (const m of members) {
      await db.runAsync(
        `INSERT INTO league_members (id, name, is_user, score, division) VALUES (?,?,?,?,?);`,
        [m.id, m.name, m.isUser ? 1 : 0, m.score, m.division],
      );
    }
  });
}
