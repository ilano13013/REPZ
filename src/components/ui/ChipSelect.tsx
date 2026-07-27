/** Sélecteur en « chips » (choix unique ou multiple). */

import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

export interface ChipOption<T extends string> {
  key: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  label?: string;
  options: ChipOption<T>[];
  selected: T[];
  onToggle: (key: T) => void;
  multiple?: boolean;
}

export function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: ChipSelectProps<T>) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <AppText variant="label" tone="muted">{label}</AppText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((opt) => {
          const active = selected.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => onToggle(opt.key)}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.accent : colors.elevated,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <AppText variant="label" style={{ color: active ? '#04140A' : colors.text }}>
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
