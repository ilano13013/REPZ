/**
 * Silhouette simplifiée : liste des groupes musculaires avec barres de
 * progression (représentation « niveau musculaire » de la v1).
 */

import React from 'react';
import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { MUSCLES, MUSCLE_ORDER } from '@/data/muscles';
import { resolveMuscleLevel } from '@/engines/muscleProgressEngine';
import type { MuscleGroup, MuscleProgress } from '@/models';

interface MuscleBarsProps {
  muscles: MuscleProgress[];
}

export function MuscleBars({ muscles }: MuscleBarsProps) {
  const { colors, spacing } = useTheme();
  const byMuscle = new Map<MuscleGroup, number>(muscles.map((m) => [m.muscle, m.xp]));
  const accents = [colors.accent, colors.accentSecondary, colors.accentTertiary];

  return (
    <View style={{ gap: spacing.md }}>
      {MUSCLE_ORDER.map((muscle, i) => {
        const state = resolveMuscleLevel(byMuscle.get(muscle) ?? 0);
        return (
          <View key={muscle} style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="label">{MUSCLES[muscle].label}</AppText>
              <AppText variant="caption" tone="muted">
                Niv. {state.level}
              </AppText>
            </View>
            <ProgressBar value={state.progress} color={accents[i % accents.length]} height={8} />
          </View>
        );
      })}
    </View>
  );
}
