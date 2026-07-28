/**
 * Progression : poids, volume hebdomadaire, 1RM estimé, records, historique,
 * caractéristiques du personnage et niveaux musculaires, avec filtres de
 * période et comparaison à la période précédente.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { LineChart, type LinePoint } from '@/components/charts/LineChart';
import { MuscleBars } from '@/components/game/MuscleBars';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore } from '@/stores/profileStore';
import { workoutRepo, trackingRepo } from '@/db/repositories';
import { EXERCISES_BY_ID } from '@/data/exercises';
import { STAT_LABEL, PR_TYPE_LABEL } from '@/utils/labels';
import { formatDate, DAY_MS } from '@/utils/date';
import { formatVolume } from '@/utils/units';
import type { BodyWeightEntry, CharacterStatKey, PersonalRecord, Workout } from '@/models';

type Period = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';
const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: '7d', label: '7 j', days: 7 },
  { key: '1m', label: '1 mois', days: 30 },
  { key: '3m', label: '3 mois', days: 90 },
  { key: '6m', label: '6 mois', days: 180 },
  { key: '1y', label: '1 an', days: 365 },
  { key: 'all', label: 'Tout', days: 100000 },
];

export default function Progress() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const muscles = useProfileStore((s) => s.muscles);
  const stats = useProfileStore((s) => s.stats);

  const [period, setPeriod] = useState<Period>('3m');
  const [history, setHistory] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);

  useEffect(() => {
    if (!profile) return;
    workoutRepo.listWorkouts(profile.id, 200).then(setHistory);
    trackingRepo.listBodyWeight(profile.id).then(setWeights);
    workoutRepo.listRecords(profile.id).then(setRecords);
  }, [profile]);

  const cutoff = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)?.days ?? 90;
    return Date.now() - days * DAY_MS;
  }, [period]);

  const inRange = history.filter((w) => (w.completedAt ?? 0) >= cutoff);
  const weightPoints: LinePoint[] = weights
    .filter((w) => w.date >= cutoff)
    .map((w) => ({ x: w.date, y: w.weightKg }));

  // Volume hebdomadaire agrégé.
  const volumePoints: LinePoint[] = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const w of inRange) {
      const wk = Math.floor((w.completedAt ?? 0) / (7 * DAY_MS));
      buckets.set(wk, (buckets.get(wk) ?? 0) + w.totalVolumeKg);
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([wk, v]) => ({ x: wk, y: v }));
  }, [inRange]);

  // Comparaison avec la période précédente.
  const periodDays = PERIODS.find((p) => p.key === period)?.days ?? 90;
  const prevCutoff = cutoff - periodDays * DAY_MS;
  const prevVolume = history
    .filter((w) => (w.completedAt ?? 0) >= prevCutoff && (w.completedAt ?? 0) < cutoff)
    .reduce((a, w) => a + w.totalVolumeKg, 0);
  const curVolume = inRange.reduce((a, w) => a + w.totalVolumeKg, 0);
  const volumeDelta = prevVolume > 0 ? Math.round(((curVolume - prevVolume) / prevVolume) * 100) : null;

  if (!profile) return null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h1">Progression</AppText>
          <AppButton label="📏 Suivi corporel" variant="secondary" onPress={() => router.push('/tracking/measurements')} />
        </View>

        <SegmentedControl
          scroll
          segments={PERIODS.map((p) => ({ key: p.key, label: p.label }))}
          value={period}
          onChange={setPeriod}
        />

        {/* Comparaison */}
        <Card>
          <AppText variant="caption" tone="muted">VOLUME SUR LA PÉRIODE</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
            <AppText variant="h1">{formatVolume(curVolume, profile.units)}</AppText>
            {volumeDelta != null ? (
              <AppText tone={volumeDelta >= 0 ? 'success' : 'danger'} variant="label" style={{ marginBottom: 6 }}>
                {volumeDelta >= 0 ? '▲' : '▼'} {Math.abs(volumeDelta)}% vs période préc.
              </AppText>
            ) : null}
          </View>
        </Card>

        {/* Graphique volume */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Volume hebdomadaire</AppText>
          <LineChart data={volumePoints} color={colors.accent} formatValue={(v) => formatVolume(v, profile.units)} />
        </Card>

        {/* Graphique poids */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Évolution du poids</AppText>
          <LineChart data={weightPoints} color={colors.accentTertiary} formatValue={(v) => `${v.toFixed(1)} kg`} />
        </Card>

        {/* Caractéristiques */}
        {stats ? (
          <Card>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Caractéristiques</AppText>
            <View style={{ gap: spacing.md }}>
              {(Object.keys(STAT_LABEL) as CharacterStatKey[]).map((k) => (
                <View key={k} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="label">{STAT_LABEL[k]}</AppText>
                    <AppText variant="caption" tone="muted">{Math.round(stats[k])}/100</AppText>
                  </View>
                  <ProgressBar value={stats[k] / 100} height={8} color={colors.accentSecondary} />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Records */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Records personnels 🏆</AppText>
          <View style={{ gap: spacing.sm }}>
            {records.length === 0 ? (
              <AppText tone="muted">Aucun record pour l'instant.</AppText>
            ) : (
              records.slice(0, 8).map((r) => (
                <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="label">{EXERCISES_BY_ID[r.exerciseId]?.name ?? r.exerciseId}</AppText>
                  <AppText tone="gold" variant="label">{PR_TYPE_LABEL[r.type]} · {Math.round(r.value)}</AppText>
                </View>
              ))
            )}
          </View>
        </Card>

        {/* Historique */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Historique des séances</AppText>
          <View style={{ gap: spacing.sm }}>
            {inRange.length === 0 ? (
              <AppText tone="muted">Aucune séance sur cette période.</AppText>
            ) : (
              inRange.slice(0, 12).map((w) => (
                <View key={w.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="label">{w.name}</AppText>
                  <AppText variant="caption" tone="muted">
                    {formatDate(w.completedAt ?? w.startedAt)} · {formatVolume(w.totalVolumeKg, profile.units)} · +{w.totalXp} XP
                  </AppText>
                </View>
              ))
            )}
          </View>
        </Card>

        {/* Niveaux musculaires */}
        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Niveaux musculaires</AppText>
          <MuscleBars muscles={muscles} />
        </Card>
      </View>
    </Screen>
  );
}
