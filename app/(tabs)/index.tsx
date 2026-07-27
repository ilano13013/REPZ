/**
 * Accueil : niveau, titre, avatar, barre d'XP, série active, prochaine séance,
 * quêtes du jour, résumé de la semaine, volume total, derniers records,
 * niveaux musculaires et bouton « Commencer l'entraînement ».
 */

import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { XpBar } from '@/components/game/XpBar';
import { MuscleBars } from '@/components/game/MuscleBars';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore, selectLevelState } from '@/stores/profileStore';
import { useGameStore } from '@/stores/gameStore';
import { workoutRepo } from '@/db/repositories';
import { PROGRAMS_BY_ID } from '@/data/programs';
import { QUESTS_BY_ID } from '@/data/quests';
import { EXERCISES_BY_ID } from '@/data/exercises';
import { formatVolume } from '@/utils/units';
import { startOfWeek } from '@/utils/date';
import { PR_TYPE_LABEL } from '@/utils/labels';
import type { PersonalRecord, Workout } from '@/models';

export default function Home() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const muscles = useProfileStore((s) => s.muscles);
  const dailyQuests = useGameStore((s) => s.dailyQuests);

  const [history, setHistory] = useState<Workout[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);

  useEffect(() => {
    if (!profile) return;
    workoutRepo.listWorkouts(profile.id).then(setHistory);
    workoutRepo.listRecords(profile.id).then((r) => setRecords(r.slice(0, 3)));
  }, [profile]);

  if (!profile) return null;
  const level = selectLevelState(profile);

  const weekStart = startOfWeek(Date.now());
  const weekWorkouts = history.filter((w) => (w.completedAt ?? 0) >= weekStart);
  const totalVolume = history.reduce((acc, w) => acc + w.totalVolumeKg, 0);
  const weekVolume = weekWorkouts.reduce((acc, w) => acc + w.totalVolumeKg, 0);

  const program = profile.activeProgramId ? PROGRAMS_BY_ID[profile.activeProgramId] : null;
  const nextDay = program?.days[history.length % Math.max(1, program.days.length)] ?? program?.days[0];

  const completedDaily = dailyQuests.filter((q) => q.completed).length;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
        {/* En-tête profil */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: colors.elevated,
              alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent,
            }}
          >
            <AppText variant="h2">{profile.name.slice(0, 1).toUpperCase()}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2">Salut {profile.name} 👋</AppText>
            <AppText tone="muted" variant="label">🔥 {profile.currentStreak} semaine(s) active(s)</AppText>
          </View>
        </View>

        {/* Barre d'XP */}
        <Card glow>
          <XpBar level={level} />
        </Card>

        {/* Bouton principal */}
        <AppButton
          label="⚡ Commencer l'entraînement"
          fullWidth
          onPress={() => router.push('/training')}
        />

        {/* Prochaine séance */}
        {nextDay ? (
          <Card>
            <AppText variant="caption" tone="muted">PROCHAINE SÉANCE</AppText>
            <AppText variant="h3" style={{ marginVertical: 4 }}>{nextDay.name}</AppText>
            <AppText tone="muted" variant="label">
              {nextDay.exercises.length} exercices · {program?.name}
            </AppText>
          </Card>
        ) : null}

        {/* Résumé de la semaine */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile style={{ flex: 1 }} value={`${weekWorkouts.length}`} label="Séances / sem." accent />
          <StatTile style={{ flex: 1 }} value={formatVolume(weekVolume, profile.units)} label="Volume / sem." />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile style={{ flex: 1 }} value={formatVolume(totalVolume, profile.units)} label="Volume total" />
          <StatTile style={{ flex: 1 }} value={`${completedDaily}/${dailyQuests.length}`} label="Quêtes du jour" />
        </View>

        {/* Quêtes du jour */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <AppText variant="h3">Quêtes du jour</AppText>
            <Pressable onPress={() => router.push('/challenges')}>
              <AppText tone="accent" variant="label">Tout voir</AppText>
            </Pressable>
          </View>
          <View style={{ gap: spacing.md }}>
            {dailyQuests.slice(0, 3).map((q) => {
              const def = QUESTS_BY_ID[q.questId];
              return (
                <View key={q.id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="label" tone={q.completed ? 'success' : 'default'}>
                      {q.completed ? '✓ ' : ''}{def?.title}
                    </AppText>
                    <AppText variant="caption" tone="muted">{Math.round(q.progress)}/{q.target}</AppText>
                  </View>
                  <ProgressBar value={q.progress / q.target} height={6} />
                </View>
              );
            })}
          </View>
        </Card>

        {/* Derniers records */}
        {records.length > 0 ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Derniers records 🏆</AppText>
            <View style={{ gap: spacing.sm }}>
              {records.map((r) => (
                <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="label">{EXERCISES_BY_ID[r.exerciseId]?.name ?? r.exerciseId}</AppText>
                  <AppText tone="gold" variant="label">
                    {PR_TYPE_LABEL[r.type]} · {Math.round(r.value)}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Niveaux musculaires */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Niveaux musculaires</AppText>
          <MuscleBars muscles={muscles} />
        </Card>
      </View>
    </Screen>
  );
}
