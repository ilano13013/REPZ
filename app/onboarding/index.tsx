/**
 * Onboarding — création du profil en plusieurs étapes.
 *
 * Utilise react-hook-form pour les champs scalaires et une sélection en chips
 * pour les énumérations/listes ; l'ensemble est validé par le schéma Zod avant
 * la création du profil (niveau 1) et la recommandation d'un programme.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { TextField } from '@/components/ui/TextField';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { onboardingSchema } from '@/validation/onboarding';
import { useProfileStore } from '@/stores/profileStore';
import { useGameStore } from '@/stores/gameStore';
import { useThemeStore } from '@/stores/themeStore';
import { recommendProgram } from '@/data/programs';
import { uid } from '@/utils/id';
import type {
  Equipment,
  FitnessLevel,
  Goal,
  Sex,
  TrainingLocation,
  Units,
  UserProfile,
  Weekday,
} from '@/models';

const GOALS: { key: Goal; label: string }[] = [
  { key: 'muscle_gain', label: 'Prise de masse' },
  { key: 'weight_loss', label: 'Perte de poids' },
  { key: 'recomposition', label: 'Recomposition' },
  { key: 'strength', label: 'Gain de force' },
  { key: 'maintenance', label: 'Maintien' },
  { key: 'general_fitness', label: 'Condition physique' },
];

const LEVELS: { key: FitnessLevel; label: string }[] = [
  { key: 'beginner', label: 'Débutant' },
  { key: 'intermediate', label: 'Intermédiaire' },
  { key: 'advanced', label: 'Avancé' },
];

const SEXES: { key: Sex; label: string }[] = [
  { key: 'male', label: 'Homme' },
  { key: 'female', label: 'Femme' },
  { key: 'unspecified', label: 'Ne pas préciser' },
];

const LOCATIONS: { key: TrainingLocation; label: string }[] = [
  { key: 'gym', label: 'Salle' },
  { key: 'home', label: 'Maison' },
  { key: 'outdoor', label: 'Extérieur' },
];

const EQUIPMENTS: { key: Equipment; label: string }[] = [
  { key: 'barbell', label: 'Barre' },
  { key: 'dumbbell', label: 'Haltères' },
  { key: 'machine', label: 'Machines' },
  { key: 'cable', label: 'Poulies' },
  { key: 'kettlebell', label: 'Kettlebell' },
  { key: 'bench', label: 'Banc' },
  { key: 'pullup_bar', label: 'Barre de traction' },
  { key: 'bodyweight', label: 'Poids du corps' },
  { key: 'band', label: 'Élastiques' },
  { key: 'cardio_machine', label: 'Cardio' },
];

const DAYS: { key: Weekday; label: string }[] = [
  { key: 'mon', label: 'Lun' }, { key: 'tue', label: 'Mar' }, { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Jeu' }, { key: 'fri', label: 'Ven' }, { key: 'sat', label: 'Sam' },
  { key: 'sun', label: 'Dim' },
];

const UNITS: { key: Units; label: string }[] = [
  { key: 'kg', label: 'Kilogrammes' },
  { key: 'lb', label: 'Livres' },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { control, getValues } = useForm({
    defaultValues: { name: '', age: '', heightCm: '', weightKg: '', limitations: '' },
  });

  const [sex, setSex] = useState<Sex>('unspecified');
  const [level, setLevel] = useState<FitnessLevel>('beginner');
  const [goal, setGoal] = useState<Goal>('general_fitness');
  const [location, setLocation] = useState<TrainingLocation>('gym');
  const [equipment, setEquipment] = useState<Equipment[]>(['barbell', 'dumbbell', 'bench']);
  const [days, setDays] = useState<Weekday[]>(['mon', 'wed', 'fri']);
  const [units, setUnits] = useState<Units>('kg');

  const toggle = <T,>(list: T[], key: T, setter: (v: T[]) => void) => {
    setter(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  };

  const num = (v: string): number | null => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const finish = async () => {
    const v = getValues();
    const candidate = {
      name: v.name.trim(),
      age: num(v.age),
      sex,
      heightCm: num(v.heightCm),
      weightKg: num(v.weightKg),
      fitnessLevel: level,
      goal,
      sessionsPerWeek: Math.max(1, days.length),
      availableDays: days,
      location,
      equipment,
      limitations: v.limitations.trim() || null,
      units,
    };

    const parsed = onboardingSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Veuillez vérifier vos informations.');
      setStep(0);
      return;
    }

    const program = recommendProgram(goal, level, candidate.sessionsPerWeek);
    const profile: UserProfile = {
      id: uid('user'),
      ...parsed.data,
      createdAt: Date.now(),
      totalXp: 0,
      level: 1,
      activeProgramId: program.id,
      currentStreak: 0,
      bestStreak: 0,
      lastWorkoutDate: null,
    };

    await useProfileStore.getState().createProfile(profile);
    useThemeStore.getState().setTheme(profile.units === 'kg' ? 'dark' : 'dark');
    await useGameStore.getState().load();
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl, gap: spacing.lg }}>
        <View>
          <AppText variant="display" tone="accent">REPZ</AppText>
          <AppText tone="muted">Transforme chaque série en expérience.</AppText>
        </View>

        <ProgressBar value={(step + 1) / TOTAL_STEPS} />

        {error ? (
          <Card style={{ borderColor: '#F87171' }}>
            <AppText tone="danger">{error}</AppText>
          </Card>
        ) : null}

        {step === 0 && (
          <Card>
            <AppText variant="h2" style={{ marginBottom: spacing.md }}>À propos de toi</AppText>
            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField label="Prénom ou pseudonyme" value={field.value} onChangeText={field.onChange} placeholder="Alex" />
                )}
              />
              <Controller
                control={control}
                name="age"
                render={({ field }) => (
                  <TextField label="Âge" value={field.value} onChangeText={field.onChange} keyboardType="numeric" placeholder="28" />
                )}
              />
              <ChipSelect label="Sexe" options={SEXES} selected={[sex]} onToggle={(k) => setSex(k)} />
            </View>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <AppText variant="h2" style={{ marginBottom: spacing.md }}>Mensurations & unités</AppText>
            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name="heightCm"
                render={({ field }) => (
                  <TextField label="Taille" value={field.value} onChangeText={field.onChange} keyboardType="numeric" suffix="cm" placeholder="178" />
                )}
              />
              <Controller
                control={control}
                name="weightKg"
                render={({ field }) => (
                  <TextField label="Poids" value={field.value} onChangeText={field.onChange} keyboardType="numeric" suffix={units} placeholder="78" />
                )}
              />
              <ChipSelect label="Unités préférées" options={UNITS} selected={[units]} onToggle={(k) => setUnits(k)} />
            </View>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <AppText variant="h2" style={{ marginBottom: spacing.md }}>Tes objectifs</AppText>
            <View style={{ gap: spacing.lg }}>
              <ChipSelect label="Objectif principal" options={GOALS} selected={[goal]} onToggle={(k) => setGoal(k)} />
              <ChipSelect label="Niveau sportif" options={LEVELS} selected={[level]} onToggle={(k) => setLevel(k)} />
              <ChipSelect label="Jours disponibles" options={DAYS} selected={days} onToggle={(k) => toggle(days, k, setDays)} multiple />
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <AppText variant="h2" style={{ marginBottom: spacing.md }}>Lieu & matériel</AppText>
            <View style={{ gap: spacing.lg }}>
              <ChipSelect label="Lieu d'entraînement" options={LOCATIONS} selected={[location]} onToggle={(k) => setLocation(k)} />
              <ChipSelect label="Matériel disponible" options={EQUIPMENTS} selected={equipment} onToggle={(k) => toggle(equipment, k, setEquipment)} multiple />
              <Controller
                control={control}
                name="limitations"
                render={({ field }) => (
                  <TextField label="Limitations physiques (facultatif)" value={field.value} onChangeText={field.onChange} placeholder="Ex : douleur épaule" />
                )}
              />
            </View>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {step > 0 ? (
            <AppButton label="Retour" variant="secondary" onPress={() => setStep(step - 1)} />
          ) : null}
          <View style={{ flex: 1 }} />
          {step < TOTAL_STEPS - 1 ? (
            <AppButton label="Continuer" onPress={() => { setError(null); setStep(step + 1); }} />
          ) : (
            <AppButton label="Créer mon profil" onPress={finish} />
          )}
        </View>
      </View>
    </Screen>
  );
}
