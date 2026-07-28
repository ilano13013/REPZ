/**
 * Suivi du poids et des mensurations (section 16).
 *
 * Saisie du poids de corps et des mensurations (bras, poitrine, taille,
 * hanches, cuisse, mollet, % de masse grasse). Toutes les données restent
 * locales. Affiche l'évolution du poids et la dernière mesure.
 */

import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { TextField } from '@/components/ui/TextField';
import { LineChart, type LinePoint } from '@/components/charts/LineChart';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore } from '@/stores/profileStore';
import { trackingRepo } from '@/db/repositories';
import { measurementSchema } from '@/validation/onboarding';
import { uid } from '@/utils/id';
import { formatDate } from '@/utils/date';
import type { BodyWeightEntry, MeasurementEntry } from '@/models';

const FIELDS: { key: keyof Omit<MeasurementEntry, 'id' | 'userId' | 'date' | 'photoUri'>; label: string; suffix: string }[] = [
  { key: 'armCm', label: 'Tour de bras', suffix: 'cm' },
  { key: 'chestCm', label: 'Tour de poitrine', suffix: 'cm' },
  { key: 'waistCm', label: 'Tour de taille', suffix: 'cm' },
  { key: 'hipsCm', label: 'Tour de hanches', suffix: 'cm' },
  { key: 'thighCm', label: 'Tour de cuisse', suffix: 'cm' },
  { key: 'calfCm', label: 'Tour de mollet', suffix: 'cm' },
  { key: 'bodyFatPct', label: 'Masse grasse (facultatif)', suffix: '%' },
];

export default function Measurements() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [weight, setWeight] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);

  const reload = () => {
    if (!profile) return;
    trackingRepo.listBodyWeight(profile.id).then(setWeights);
    trackingRepo.listMeasurements(profile.id).then(setMeasurements);
  };
  useEffect(reload, [profile]);

  if (!profile) return null;

  const num = (v: string): number | null => {
    const n = parseFloat((v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const saveWeight = async () => {
    const w = num(weight);
    if (w == null || w < 30 || w > 300) {
      Alert.alert('Poids invalide', 'Saisis un poids entre 30 et 300.');
      return;
    }
    await trackingRepo.addBodyWeight({ id: uid('bw'), userId: profile.id, weightKg: w, date: Date.now() });
    // Met à jour le poids courant du profil (utile pour le calcul d'XP au poids du corps).
    await updateProfile({ weightKg: w });
    setWeight('');
    reload();
  };

  const saveMeasurement = async () => {
    const candidate = {
      armCm: num(values.armCm), chestCm: num(values.chestCm), waistCm: num(values.waistCm),
      hipsCm: num(values.hipsCm), thighCm: num(values.thighCm), calfCm: num(values.calfCm),
      bodyFatPct: num(values.bodyFatPct),
    };
    const parsed = measurementSchema.safeParse(candidate);
    if (!parsed.success) {
      Alert.alert('Valeur invalide', parsed.error.issues[0]?.message ?? 'Vérifie tes saisies.');
      return;
    }
    await trackingRepo.addMeasurement({
      id: uid('meas'), userId: profile.id, date: Date.now(), photoUri: null, ...parsed.data,
    });
    setValues({});
    reload();
    Alert.alert('Enregistré', 'Mensurations ajoutées.');
  };

  const weightPoints: LinePoint[] = weights.map((w) => ({ x: w.date, y: w.weightKg }));
  const last = measurements[measurements.length - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h1">Suivi corporel</AppText>
          <AppButton label="Fermer" variant="ghost" onPress={() => router.back()} />
        </View>

        {/* Poids */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Poids de corps</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <TextField label="Poids actuel" value={weight} onChangeText={setWeight} keyboardType="numeric" suffix={profile.units} placeholder="78" />
            </View>
            <AppButton label="Ajouter" onPress={saveWeight} />
          </View>
          <View style={{ marginTop: spacing.md }}>
            <LineChart data={weightPoints} color={colors.accentTertiary} formatValue={(v) => `${v.toFixed(1)} kg`} />
          </View>
        </Card>

        {/* Mensurations */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Mensurations</AppText>
          <View style={{ gap: spacing.md }}>
            {FIELDS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                value={values[f.key] ?? ''}
                onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                keyboardType="numeric"
                suffix={f.suffix}
              />
            ))}
          </View>
          <AppButton label="Enregistrer les mensurations" fullWidth style={{ marginTop: spacing.md }} onPress={saveMeasurement} />
        </Card>

        {/* Dernière mesure */}
        {last ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Dernière mesure · {formatDate(last.date)}</AppText>
            <View style={{ gap: spacing.xs }}>
              {FIELDS.map((f) => {
                const v = last[f.key];
                if (v == null) return null;
                return (
                  <View key={f.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="label" tone="muted">{f.label}</AppText>
                    <AppText variant="label">{v} {f.suffix}</AppText>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        <AppText variant="caption" tone="faint" style={{ textAlign: 'center' }}>
          Toutes ces données restent sur ton appareil.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
