/**
 * Entraînement : programme actif, sélection du jour, démarrage d'une séance
 * (programmée ou libre) et changement de programme prédéfini.
 */

import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { PROGRAMS, PROGRAMS_BY_ID } from '@/data/programs';
import { getExercise } from '@/data/exercises';

export default function Training() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [pickingProgram, setPickingProgram] = useState(false);

  if (!profile) return null;
  const program = profile.activeProgramId ? PROGRAMS_BY_ID[profile.activeProgramId] : PROGRAMS[0];

  const startDay = async (dayId: string) => {
    await useSessionStore.getState().startFromProgramDay(program.id, dayId);
    router.push('/workout/active');
  };

  const startEmpty = async () => {
    await useSessionStore.getState().startEmpty();
    router.push('/workout/active');
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
        <AppText variant="h1">Entraînement</AppText>

        {/* Programme actif */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="muted">PROGRAMME ACTIF</AppText>
              <AppText variant="h3">{program.name}</AppText>
              <AppText tone="muted" variant="label">{program.description}</AppText>
            </View>
            <Pressable onPress={() => setPickingProgram((v) => !v)}>
              <AppText tone="accent" variant="label">Changer</AppText>
            </Pressable>
          </View>
        </Card>

        {pickingProgram ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Programmes prédéfinis</AppText>
            <View style={{ gap: spacing.sm }}>
              {PROGRAMS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={async () => {
                    await updateProfile({ activeProgramId: p.id });
                    setPickingProgram(false);
                  }}
                  style={{
                    padding: spacing.md,
                    borderRadius: 12,
                    backgroundColor: p.id === program.id ? colors.elevated : 'transparent',
                    borderWidth: 1,
                    borderColor: p.id === program.id ? colors.accent : colors.border,
                  }}
                >
                  <AppText variant="label">{p.name}</AppText>
                  <AppText variant="caption" tone="muted">{p.daysPerWeek} j/sem · {p.level}</AppText>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Jours du programme */}
        <AppText variant="h3">Séances</AppText>
        <View style={{ gap: spacing.md }}>
          {program.days.map((day) => (
            <Card key={day.id}>
              <AppText variant="h3">{day.name}</AppText>
              <View style={{ marginVertical: spacing.sm, gap: 2 }}>
                {day.exercises.slice(0, 5).map((t) => (
                  <AppText key={t.exerciseId} variant="label" tone="muted">
                    • {getExercise(t.exerciseId)?.name ?? t.exerciseId} — {t.sets}×{t.targetReps}
                  </AppText>
                ))}
              </View>
              <AppButton label="Démarrer cette séance" onPress={() => startDay(day.id)} />
            </Card>
          ))}
        </View>

        <AppButton label="+ Séance libre" variant="secondary" fullWidth onPress={startEmpty} />
      </View>
    </Screen>
  );
}
