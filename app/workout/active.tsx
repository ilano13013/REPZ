/**
 * Séance en cours.
 *
 * Flux : check-in de récupération → saisie/validation des séries (avec gain
 * d'XP animé, détection de records, chrono de repos) → clôture avec récap.
 * Conçu pour être très simple à utiliser pendant l'effort.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { XpGainToast } from '@/components/game/XpGainToast';
import { RecoveryCheckinCard } from '@/components/game/RecoveryCheckinCard';
import { useTheme } from '@/hooks/useTheme';
import { useSessionStore } from '@/stores/sessionStore';
import { useProfileStore } from '@/stores/profileStore';
import { getExercise } from '@/data/exercises';
import { trackingRepo, workoutRepo } from '@/db/repositories';
import { estimateSetXp } from '@/engines/xpEngine';
import { safetyWarnings, type SafetySignals } from '@/engines/recoveryEngine';
import { workoutMuscles } from '@/engines/workoutEngine';
import { uid } from '@/utils/id';
import { daysBetween } from '@/utils/date';
import type { MuscleGroup, SetEntry, Workout, WorkoutExercise } from '@/models';

export default function ActiveWorkout() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const workout = useSessionStore((s) => s.workout);
  const restEndsAt = useSessionStore((s) => s.restEndsAt);

  const [checkinDone, setCheckinDone] = useState(false);
  const [toast, setToast] = useState<{ xp: number; record: boolean; key: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [recent, setRecent] = useState<Workout[]>([]);
  const [note, setNoteState] = useState('');

  // Horloge pour le chrono de repos.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // Historique récent pour les avertissements de sécurité.
  useEffect(() => {
    if (profile) workoutRepo.listWorkouts(profile.id, 8).then(setRecent);
  }, [profile]);

  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;
  useEffect(() => {
    if (restEndsAt && restLeft === 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useSessionStore.getState().clearRest();
    }
  }, [restLeft, restEndsAt]);

  if (!workout || !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <AppText>Aucune séance active.</AppText>
        <AppButton label="Retour" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (!checkinDone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <RecoveryCheckinCard
            onSkip={() => setCheckinDone(true)}
            onSubmit={async (assessment, values) => {
              await trackingRepo.addCheckin({
                id: uid('chk'), userId: profile.id, date: Date.now(), ...values,
              });
              const warnings = [...assessment.warnings, ...safetyWarnings(computeSignals(recent, workout))];
              if (warnings.length > 0) {
                Alert.alert('Recommandation', `${assessment.message}\n\n${warnings.join('\n')}`);
              }
              setCheckinDone(true);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const validate = async (weId: string, setId: string) => {
    const result = await useSessionStore.getState().validateSet(weId, setId);
    const isRecord = result.records.length > 0;
    setToast({ xp: result.xp, record: isRecord, key: Date.now() });
    void Haptics.impactAsync(
      isRecord ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    );
    // Lance le repos selon l'exercice.
    const we = workout.exercises.find((x) => x.id === weId);
    const ex = we ? getExercise(we.exerciseId) : undefined;
    if (ex) useSessionStore.getState().startRest(ex.recommended.restSeconds);
  };

  const finish = () => {
    Alert.alert('Terminer la séance ?', 'Ton XP et tes records seront enregistrés.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        onPress: async () => {
          const { totalXp, volume } = await useSessionStore.getState().finishWorkout();
          Alert.alert(
            'Séance terminée 💪',
            `+${totalXp} XP · Volume ${Math.round(volume)} kg`,
            [{ text: 'Super !', onPress: () => router.replace('/(tabs)') }],
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* En-tête */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText variant="caption" tone="muted">SÉANCE EN COURS</AppText>
            <AppText variant="h1">{workout.name}</AppText>
          </View>
          <Pressable onPress={() => { useSessionStore.getState().discard(); router.back(); }}>
            <AppText tone="danger" variant="label">Quitter</AppText>
          </Pressable>
        </View>

        {/* Chrono de repos */}
        {restLeft > 0 ? (
          <Card glow style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="h3">⏱️ Repos</AppText>
              <AppText variant="metric" tone="accent">{restLeft}s</AppText>
              <Pressable onPress={() => useSessionStore.getState().clearRest()}>
                <AppText tone="muted" variant="label">Passer</AppText>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {/* Exercices */}
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
          {workout.exercises.map((we) => (
            <ExerciseBlock key={we.id} we={we} onValidate={validate} />
          ))}
        </View>

        {/* Ajouter un exercice (séance libre) */}
        {workout.programId == null ? (
          <AppButton
            label="+ Ajouter un exercice"
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.lg }}
            onPress={() => router.push('/workout/pick-exercise')}
          />
        ) : null}

        {/* Note de séance */}
        <Card style={{ marginTop: spacing.lg }}>
          <AppText variant="caption" tone="muted">NOTE DE SÉANCE</AppText>
          <TextInput
            value={note}
            onChangeText={(t) => { setNoteState(t); useSessionStore.getState().setNote(t); }}
            placeholder="Sensations, douleurs, remarques…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={{ color: colors.text, fontSize: 15, marginTop: spacing.xs, minHeight: 44 }}
          />
        </Card>

        <AppButton label="✓ Terminer la séance" fullWidth style={{ marginTop: spacing.xl }} onPress={finish} />
      </ScrollView>

      {toast ? (
        <XpGainToast key={toast.key} xp={toast.xp} isRecord={toast.record} onDone={() => setToast(null)} />
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Signaux de sécurité dérivés de l'historique récent
// ---------------------------------------------------------------------------

/**
 * Calcule des signaux objectifs pour `safetyWarnings` :
 * - tendance de performance (volume) sur les dernières séances,
 * - sollicitation du même muscle sans repos (muscle prévu déjà travaillé la veille).
 */
function computeSignals(recent: Workout[], current: Workout): SafetySignals {
  const signals: SafetySignals = {};
  const sorted = [...recent].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  // Tendance de performance : moyenne des 2 dernières vs 2 précédentes.
  if (sorted.length >= 4) {
    const avg = (arr: Workout[]) => arr.reduce((s, w) => s + w.totalVolumeKg, 0) / (arr.length || 1);
    const last2 = avg(sorted.slice(0, 2));
    const prev2 = avg(sorted.slice(2, 4));
    if (prev2 > 0) signals.performanceTrend = (last2 - prev2) / prev2;
  }

  // Muscle prévu déjà travaillé très récemment (< 2 jours).
  const last = sorted[0];
  if (last?.completedAt && daysBetween(last.completedAt, Date.now()) <= 1) {
    const plannedMuscles = new Set<MuscleGroup>(
      current.exercises
        .map((we) => getExercise(we.exerciseId)?.primaryMuscle)
        .filter((m): m is MuscleGroup => !!m),
    );
    const lastMuscles = workoutMuscles(last, getExercise);
    const overlap = lastMuscles.some((m) => plannedMuscles.has(m));
    if (overlap) signals.sameMuscleConsecutiveDays = 3;
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Bloc d'un exercice
// ---------------------------------------------------------------------------

function ExerciseBlock({
  we,
  onValidate,
}: {
  we: WorkoutExercise;
  onValidate: (weId: string, setId: string) => void;
}) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const exercise = getExercise(we.exerciseId);
  const done = we.sets.filter((s) => s.completed).length;

  if (!exercise) return null;

  return (
    <Card style={{ opacity: we.skipped ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{exercise.name}</AppText>
          <AppText variant="caption" tone="muted">
            {done}/{we.sets.length} séries · repos {exercise.recommended.restSeconds}s
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable onPress={() => router.push({ pathname: '/workout/pick-exercise', params: { replace: we.id } })}>
            <AppText tone="accent" variant="caption">Remplacer</AppText>
          </Pressable>
          <Pressable onPress={() => useSessionStore.getState().skipExercise(we.id)}>
            <AppText tone="muted" variant="caption">{we.skipped ? 'Reprendre' : 'Passer'}</AppText>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {we.sets.map((set, i) => (
          <SetRow key={set.id} we={we} set={set} index={i} exercise={exercise} onValidate={onValidate} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable onPress={() => useSessionStore.getState().addSet(we.id)}>
          <AppText tone="accent" variant="label">+ Série</AppText>
        </Pressable>
        <View style={{ flex: 1 }} />
        {we.sets.length > 1 ? (
          <Pressable onPress={() => useSessionStore.getState().removeSet(we.id, we.sets[we.sets.length - 1].id)}>
            <AppText tone="danger" variant="label">− Série</AppText>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Ligne d'une série
// ---------------------------------------------------------------------------

function SetRow({
  we,
  set,
  index,
  exercise,
  onValidate,
}: {
  we: WorkoutExercise;
  set: SetEntry;
  index: number;
  exercise: ReturnType<typeof getExercise>;
  onValidate: (weId: string, setId: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const isBodyweight = exercise?.type === 'bodyweight';
  const isDuration = exercise?.type === 'duration' || exercise?.type === 'cardio';

  const estimate = useMemo(() => {
    if (!exercise || !profile) return 0;
    return estimateSetXp(exercise, set, profile.weightKg ?? 75);
  }, [exercise, set, profile]);

  const field = (
    value: number | null,
    onChange: (n: number | null) => void,
    placeholder: string,
    suffix: string,
  ) => (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated,
          borderRadius: radius.sm, paddingHorizontal: spacing.sm,
        }}
      >
        <TextInput
          value={value == null ? '' : String(value)}
          onChangeText={(t) => {
            const n = parseFloat(t.replace(',', '.'));
            onChange(Number.isFinite(n) ? n : null);
          }}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          style={{ flex: 1, color: colors.text, paddingVertical: spacing.sm, fontSize: 18, fontWeight: '700' }}
        />
        <AppText variant="caption" tone="faint">{suffix}</AppText>
      </View>
    </View>
  );

  const update = (patch: Partial<SetEntry>) =>
    useSessionStore.getState().updateSet(we.id, set.id, patch);

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        opacity: set.completed ? 0.6 : 1,
      }}
    >
      <AppText variant="label" tone="muted" style={{ width: 20 }}>{index + 1}</AppText>

      {isDuration
        ? field(set.durationSec, (n) => update({ durationSec: n }), '30', 's')
        : field(set.weightKg, (n) => update({ weightKg: n }), isBodyweight ? '+0' : '20', 'kg')}
      {!isDuration
        ? field(set.reps, (n) => update({ reps: n }), '10', 'reps')
        : null}
      {field(set.rpe, (n) => update({ rpe: n }), 'RPE', '/10')}

      <View style={{ alignItems: 'flex-end', width: 54 }}>
        {!set.completed ? (
          <AppText variant="caption" tone="accent">+{estimate}</AppText>
        ) : (
          <AppText variant="caption" tone={set.isPersonalRecord ? 'gold' : 'success'}>
            {set.isPersonalRecord ? '🏆' : ''}+{set.xpEarned}
          </AppText>
        )}
      </View>

      <Pressable
        onPress={() => onValidate(we.id, set.id)}
        disabled={set.completed}
        style={{
          width: 40, height: 40, borderRadius: radius.sm,
          backgroundColor: set.completed ? colors.success : colors.accent,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AppText style={{ color: '#04140A', fontWeight: '800', fontSize: 18 }}>✓</AppText>
      </Pressable>
    </View>
  );
}
