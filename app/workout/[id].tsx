/**
 * Détail d'une séance passée : exercices, séries validées (charge × reps),
 * records battus, XP gagnée, volume et durée.
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { workoutRepo } from '@/db/repositories';
import { getExercise } from '@/data/exercises';
import { formatDate } from '@/utils/date';
import { formatWeight, formatVolume } from '@/utils/units';
import { useProfileStore } from '@/stores/profileStore';
import type { Workout } from '@/models';

export default function WorkoutDetail() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const units = useProfileStore((s) => s.profile?.units ?? 'kg');
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (params.id) workoutRepo.getWorkout(params.id).then(setWorkout);
  }, [params.id]);

  if (!workout) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <AppText tone="muted">Chargement…</AppText>
        <AppButton label="Retour" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const durationMin = workout.completedAt
    ? Math.max(1, Math.round((workout.completedAt - workout.startedAt) / 60000))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText variant="caption" tone="muted">{formatDate(workout.completedAt ?? workout.startedAt)}</AppText>
            <AppText variant="h1">{workout.name}</AppText>
          </View>
          <AppButton label="Fermer" variant="ghost" onPress={() => router.back()} />
        </View>

        {/* Résumé */}
        <Card glow>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Metric value={`+${workout.totalXp}`} label="XP" accent />
            <Metric value={formatVolume(workout.totalVolumeKg, units)} label="Volume" />
            <Metric value={durationMin ? `${durationMin} min` : '—'} label="Durée" />
          </View>
        </Card>

        {/* Exercices */}
        {workout.exercises.map((we) => {
          const ex = getExercise(we.exerciseId);
          const completed = we.sets.filter((s) => s.completed);
          if (completed.length === 0 && !we.skipped) return null;
          return (
            <Card key={we.id} style={{ opacity: we.skipped ? 0.5 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="h3">{ex?.name ?? we.exerciseId}</AppText>
                {we.skipped ? <AppText variant="caption" tone="muted">Passé</AppText> : null}
              </View>
              <View style={{ marginTop: spacing.sm, gap: 6 }}>
                {completed.map((s, i) => (
                  <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <AppText variant="label" tone="muted" style={{ width: 20 }}>{i + 1}</AppText>
                    <AppText variant="label" style={{ flex: 1 }}>
                      {ex?.type === 'duration'
                        ? `${s.durationSec ?? 0}s`
                        : `${formatWeight(s.weightKg ?? 0, units)} × ${s.reps ?? 0}`}
                    </AppText>
                    {s.isPersonalRecord ? <AppText variant="caption" tone="gold">🏆 Record</AppText> : null}
                    <AppText variant="caption" tone="accent">+{s.xpEarned}</AppText>
                  </View>
                ))}
              </View>
            </Card>
          );
        })}

        {workout.note ? (
          <Card>
            <AppText variant="caption" tone="muted">NOTE</AppText>
            <AppText style={{ marginTop: 4 }}>{workout.note}</AppText>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText variant="h2" tone={accent ? 'accent' : 'default'}>{value}</AppText>
      <AppText variant="caption" tone="muted">{label.toUpperCase()}</AppText>
    </View>
  );
}
