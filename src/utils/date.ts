/** Utilitaires de dates (jours, semaines, streaks). */

const DAY_MS = 86_400_000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

/** Début de la semaine ISO (lundi) pour un timestamp. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function endOfWeek(ts: number): number {
  return startOfWeek(ts) + 7 * DAY_MS - 1;
}

const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function shortWeekday(ts: number): string {
  return WEEKDAYS_FR[new Date(ts).getDay()];
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

export { DAY_MS };
