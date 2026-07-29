/**
 * Service de notifications locales (expo-notifications).
 *
 * Planifie des rappels d'entraînement hebdomadaires selon les jours disponibles
 * de l'utilisateur, et une notification de fin de repos pendant la séance.
 * Tout est local — aucune notification distante.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { UserProfile, Weekday } from '@/models';

// Affiche les notifications même app au premier plan.
// Sur le web, les notifications locales planifiées ne sont pas prises en
// charge : on évite d'installer le gestionnaire pour ne pas polluer la console.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Correspondance jour → indice de calendrier Expo (1 = dimanche … 7 = samedi). */
const WEEKDAY_TO_CALENDAR: Record<Weekday, number> = {
  sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7,
};

const REMINDER_HOUR = 18;

/** Demande l'autorisation d'envoyer des notifications. Retourne true si accordée. */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * (Re)planifie les rappels hebdomadaires d'entraînement pour les jours
 * disponibles du profil. Annule d'abord les rappels existants.
 */
export async function scheduleWorkoutReminders(profile: UserProfile): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllReminders();

  for (const day of profile.availableDays) {
    const weekday = WEEKDAY_TO_CALENDAR[day];
    if (!weekday) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `reminder_${day}`,
      content: {
        title: '💪 REPZ — C\'est l\'heure de s\'entraîner',
        body: 'Ta séance t\'attend. Gagne de l\'XP et grimpe les niveaux !',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday,
        hour: REMINDER_HOUR,
        minute: 0,
        repeats: true,
      },
    });
  }
}

/** Annule tous les rappels planifiés. */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Notifie la fin du temps de repos après `seconds`. Utile si l'app passe en
 * arrière-plan pendant le repos.
 */
export async function scheduleRestEnd(seconds: number): Promise<string | null> {
  if (Platform.OS === 'web' || seconds <= 0) return null;
  const granted = await requestPermissions();
  if (!granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: '⏱️ Repos terminé', body: 'Prêt pour la série suivante ?' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/** Annule une notification planifiée par son identifiant. */
export async function cancelScheduled(id: string | null): Promise<void> {
  if (Platform.OS === 'web' || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}
