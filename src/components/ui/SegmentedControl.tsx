/** Contrôle segmenté (filtres de période, choix). */

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

interface Segment<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
  scroll?: boolean;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scroll,
}: SegmentedControlProps<T>) {
  const { colors, radius, spacing } = useTheme();

  const content = (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {segments.map((seg) => {
        const active = seg.key === value;
        return (
          <Pressable
            key={seg.key}
            onPress={() => onChange(seg.key)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.accent : colors.elevated,
            }}
          >
            <AppText
              variant="label"
              style={{ color: active ? '#04140A' : colors.textMuted }}
            >
              {seg.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {content}
      </ScrollView>
    );
  }
  return content;
}
