/**
 * Entraînement : programme actif, sélection du jour, démarrage d'une séance
 * (programmée ou libre), changement de programme (prédéfini ou personnalisé),
 * création/duplication/édition de programmes personnalisés.
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
import { useProgramStore } from '@/stores/programStore';
import { PROGRAMS } from '@/data/programs';
import { getExercise } from '@/data/exercises';

export default function Training() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const custom = useProgramStore((s) => s.custom);
  const [pickingProgram, setPickingProgram] = useState(false);

  if (!profile) return null;
  const allPrograms = [...PROGRAMS, ...custom];
  const program =
    (profile.activeProgramId && useProgramStore.getState().getById(profile.activeProgramId)) ||
    PROGRAMS[0];

  const startDay = async (dayId: string) => {
    await useSessionStore.getState().startFromProgramDay(program.id, dayId);
    router.push('/workout/active');
  };

  const startEmpty = async () => {
    await useSessionStore.getState().startEmpty();
    router.push('/workout/active');
  };

  const createProgram = async () => {
    const p = await useProgramStore.getState().createBlank('Mon programme');
    router.push({ pathname: '/program/[id]', params: { id: p.id } });
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
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Pressable onPress={() => setPickingProgram((v) => !v)}>
                <AppText tone="accent" variant="label">Changer</AppText>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/program/[id]', params: { id: program.id } })}>
                <AppText tone="muted" variant="label">{program.isPreset ? 'Voir / dupliquer' : 'Éditer'}</AppText>
              </Pressable>
            </View>
          </View>
        </Card>

        {pickingProgram ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Choisir un programme</AppText>
            <View style={{ gap: spacing.sm }}>
              {allPrograms.map((p) => (
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
                  <AppText variant="label">
                    {p.name} {p.isPreset ? '' : '· perso'}
                  </AppText>
                  <AppText variant="caption" tone="muted">{p.daysPerWeek} j/sem · {p.level}</AppText>
                </Pressable>
              ))}
            </View>
            <AppButton label="+ Créer un programme" variant="secondary" fullWidth style={{ marginTop: spacing.md }} onPress={createProgram} />
          </Card>
        ) : null}

        {/* Jours du programme */}
        <AppText variant="h3">Séances</AppText>
        <View style={{ gap: spacing.md }}>
          {program.days.map((day) => (
            <Card key={day.id}>
              <AppText variant="h3">{day.name}</AppText>
              <View style={{ marginVertical: spacing.sm, gap: 2 }}>
                {day.exercises.slice(0, 5).map((t, i) => (
                  <AppText key={`${t.exerciseId}_${i}`} variant="label" tone="muted">
                    • {getExercise(t.exerciseId)?.name ?? t.exerciseId} — {t.sets}×{t.targetReps}
                  </AppText>
                ))}
                {day.exercises.length === 0 ? (
                  <AppText variant="caption" tone="faint">Aucun exercice — édite le programme.</AppText>
                ) : null}
              </View>
              {day.exercises.length > 0 ? (
                <AppButton label="Démarrer cette séance" onPress={() => startDay(day.id)} />
              ) : null}
            </Card>
          ))}
        </View>

        <AppButton label="+ Séance libre" variant="secondary" fullWidth onPress={startEmpty} />
      </View>
    </Screen>
  );
}
