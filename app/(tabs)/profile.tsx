/**
 * Profil : avatar, pseudonyme, niveau, titre, ligue, XP totale, séances,
 * volume total, records, badges, séries, caractéristiques et paramètres
 * (thème, unités, notifications, confidentialité, gestion des données).
 */

import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { StatTile } from '@/components/ui/StatTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadarChart } from '@/components/charts/RadarChart';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import { useProfileStore, selectLevelState } from '@/stores/profileStore';
import { useGameStore, divisionForScore } from '@/stores/gameStore';
import { workoutRepo } from '@/db/repositories';
import { BADGES } from '@/data/badges';
import { DIVISION_LABEL } from '@/engines/leagueEngine';
import { STAT_LABEL, GOAL_LABEL } from '@/utils/labels';
import { formatVolume } from '@/utils/units';
import { exportData, importData, loadDemo, resetAll } from '@/services/dataService';
import type { CharacterStatKey, Workout } from '@/models';

export default function Profile() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const stats = useProfileStore((s) => s.stats);
  const badges = useProfileStore((s) => s.badges);
  const settings = useProfileStore((s) => s.settings);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const updateSettings = useProfileStore((s) => s.updateSettings);
  const themeName = useThemeStore((s) => s.name);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const league = useGameStore((s) => s.league);

  const [history, setHistory] = useState<Workout[]>([]);
  useEffect(() => {
    if (profile) workoutRepo.listWorkouts(profile.id, 500).then(setHistory);
  }, [profile]);

  if (!profile) return null;
  const level = selectLevelState(profile);
  const totalVolume = history.reduce((a, w) => a + w.totalVolumeKg, 0);
  const userScore = league.find((m) => m.isUser)?.score ?? 0;
  const division = divisionForScore(userScore);

  const confirmReset = () => {
    Alert.alert('Réinitialiser', 'Supprimer TOUTES les données locales ? Action irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await resetAll();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const runDemo = () => {
    Alert.alert('Mode démonstration', 'Remplacer les données actuelles par un profil de démo (niveau 12) ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Charger', onPress: async () => { await loadDemo(); router.replace('/(tabs)'); } },
    ]);
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
        {/* En-tête */}
        <Card glow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32, backgroundColor: colors.elevated,
              alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent,
            }}>
              <AppText variant="h1">{profile.name.slice(0, 1).toUpperCase()}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2">{profile.name}</AppText>
              <AppText tone="accent" variant="label">Niv. {level.level} · {level.title}</AppText>
              <AppText tone="muted" variant="caption">Ligue {DIVISION_LABEL[division]} · {GOAL_LABEL[profile.goal]}</AppText>
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={level.progress} />
          </View>
        </Card>

        {/* Stats clés */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile style={{ flex: 1 }} value={`${profile.totalXp}`} label="XP totale" accent />
          <StatTile style={{ flex: 1 }} value={`${history.length}`} label="Séances" />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile style={{ flex: 1 }} value={formatVolume(totalVolume, profile.units)} label="Volume total" />
          <StatTile style={{ flex: 1 }} value={`🔥 ${profile.currentStreak}`} label={`Série (record ${profile.bestStreak})`} />
        </View>

        {/* Caractéristiques */}
        {stats ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Fiche de personnage</AppText>
            <RadarChart
              axes={(Object.keys(STAT_LABEL) as CharacterStatKey[]).map((k) => ({
                label: STAT_LABEL[k],
                value: stats[k],
              }))}
            />
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {(Object.keys(STAT_LABEL) as CharacterStatKey[]).map((k) => (
                <View key={k} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="label">{STAT_LABEL[k]}</AppText>
                    <AppText variant="caption" tone="muted">{Math.round(stats[k])}</AppText>
                  </View>
                  <ProgressBar value={stats[k] / 100} height={8} color={colors.accentSecondary} />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Badges */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Badges ({badges.length}/{BADGES.length})</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {BADGES.map((b) => {
              const owned = badges.some((ub) => ub.badgeId === b.id);
              return (
                <View key={b.id} style={{ alignItems: 'center', width: 64, opacity: owned ? 1 : 0.25 }}>
                  <AppText style={{ fontSize: 30 }}>{b.icon}</AppText>
                  <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>{b.name}</AppText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Paramètres */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Paramètres</AppText>
          <View style={{ gap: spacing.md }}>
            <Row label="Thème sombre">
              <Switch value={themeName === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
            </Row>
            <Row label="Notifications">
              <Switch
                value={settings?.notificationsEnabled ?? true}
                onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
                trackColor={{ true: colors.accent }}
              />
            </Row>
            <Row label="Partager mes stats (ligue)">
              <Switch
                value={settings?.privacyShareStats ?? true}
                onValueChange={(v) => updateSettings({ privacyShareStats: v })}
                trackColor={{ true: colors.accent }}
              />
            </Row>
            <Row label={`Unités : ${profile.units}`}>
              <Pressable onPress={() => updateProfile({ units: profile.units === 'kg' ? 'lb' : 'kg' })}>
                <AppText tone="accent" variant="label">Changer</AppText>
              </Pressable>
            </Row>
          </View>
        </Card>

        {/* Données */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Données locales</AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton label="Exporter (JSON)" variant="secondary" fullWidth onPress={() => exportData().catch(() => Alert.alert('Export indisponible'))} />
            <AppButton label="Importer une sauvegarde" variant="secondary" fullWidth onPress={() => importData().then((ok) => ok && router.replace('/(tabs)')).catch(() => Alert.alert('Import échoué'))} />
            <AppButton label="Charger le mode démo" variant="secondary" fullWidth onPress={runDemo} />
            <AppButton label="Réinitialiser l'application" variant="danger" fullWidth onPress={confirmReset} />
          </View>
        </Card>

        <AppText variant="caption" tone="faint" style={{ textAlign: 'center' }}>
          REPZ n'est pas un outil médical. En cas de douleur persistante ou inhabituelle, consultez un professionnel de santé.
        </AppText>
      </View>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}
