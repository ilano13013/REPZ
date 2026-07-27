/**
 * Mini check-in de récupération avant séance. Renvoie l'évaluation (adaptation
 * de charge / volume / repos) via `onSubmit`. Rappel : non médical.
 */

import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '../ui/Card';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { assessCheckin, RECOVERY_DISCLAIMER, type RecoveryAssessment } from '@/engines/recoveryEngine';

interface Props {
  onSubmit: (assessment: RecoveryAssessment, values: {
    energy: number; sleepQuality: number; soreness: number; motivation: number; pain: boolean;
  }) => void;
  onSkip: () => void;
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="muted">{label}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{
              flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm,
              backgroundColor: value === n ? colors.accent : colors.elevated,
            }}
          >
            <AppText variant="label" style={{ color: value === n ? '#04140A' : colors.textMuted }}>{n}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function RecoveryCheckinCard({ onSubmit, onSkip }: Props) {
  const { colors, spacing } = useTheme();
  const [energy, setEnergy] = useState(3);
  const [sleepQuality, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [pain, setPain] = useState(false);

  const submit = () => {
    const values = { energy, sleepQuality, soreness, motivation, pain };
    onSubmit(assessCheckin(values), values);
  };

  return (
    <Card>
      <AppText variant="h2">Check-in du jour</AppText>
      <AppText tone="muted" variant="label" style={{ marginBottom: spacing.md }}>
        Ajuste ta séance selon ta forme.
      </AppText>
      <View style={{ gap: spacing.md }}>
        <Scale label="Énergie" value={energy} onChange={setEnergy} />
        <Scale label="Qualité du sommeil" value={sleepQuality} onChange={setSleep} />
        <Scale label="Courbatures / fatigue musculaire" value={soreness} onChange={setSoreness} />
        <Scale label="Motivation" value={motivation} onChange={setMotivation} />
        <Pressable
          onPress={() => setPain((p) => !p)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md,
            borderRadius: 12, borderWidth: 1, borderColor: pain ? colors.danger : colors.border,
          }}
        >
          <AppText>{pain ? '⚠️' : '⭕'}</AppText>
          <AppText variant="label">Je ressens une douleur</AppText>
        </Pressable>
      </View>
      <AppText variant="caption" tone="faint" style={{ marginTop: spacing.md }}>
        {RECOVERY_DISCLAIMER}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <AppButton label="Passer" variant="ghost" onPress={onSkip} />
        <View style={{ flex: 1 }} />
        <AppButton label="Commencer" onPress={submit} />
      </View>
    </Card>
  );
}
