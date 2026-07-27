/** Carte du boss hebdomadaire : barre de vie, progression, temps restant. */

import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { AppText } from '../ui/AppText';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { bossHealthFraction } from '@/engines/workoutEngine';
import { daysBetween } from '@/utils/date';
import type { WeeklyBoss } from '@/models';

const METRIC_LABEL: Record<WeeklyBoss['metric'], string> = {
  total_volume: 'kg de volume',
  total_sets: 'séries',
  workouts: 'séances',
  active_minutes: 'minutes actives',
};

export function BossCard({ boss }: { boss: WeeklyBoss }) {
  const { colors, spacing } = useTheme();
  const health = bossHealthFraction(boss);
  const daysLeft = Math.max(0, daysBetween(Date.now(), boss.endsAt));

  return (
    <Card glow={!boss.defeated}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <AppText variant="caption" tone="muted">BOSS DE LA SEMAINE</AppText>
          <AppText variant="h2">⚔️ {boss.name}</AppText>
        </View>
        <AppText variant="caption" tone={daysLeft <= 1 ? 'danger' : 'muted'}>
          {boss.defeated ? 'VAINCU' : `${daysLeft}j restants`}
        </AppText>
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
        <ProgressBar value={1 - health} color={colors.danger} height={14} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="caption" tone="muted">
            {Math.round(boss.progress).toLocaleString('fr-FR')} / {Math.round(boss.target).toLocaleString('fr-FR')} {METRIC_LABEL[boss.metric]}
          </AppText>
          <AppText variant="caption" tone="gold">+{boss.rewardXp} XP</AppText>
        </View>
      </View>
    </Card>
  );
}
