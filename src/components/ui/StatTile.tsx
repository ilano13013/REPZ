/** Tuile de statistique : grand chiffre + libellé, très lisible. */

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Card } from './Card';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

interface StatTileProps {
  value: string;
  label: string;
  accent?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function StatTile({ value, label, accent, icon, style }: StatTileProps) {
  const { spacing } = useTheme();
  return (
    <Card style={style}>
      <View style={{ gap: spacing.xs }}>
        {icon ? <AppText variant="h3">{icon}</AppText> : null}
        <AppText variant="h1" tone={accent ? 'accent' : 'default'}>
          {value}
        </AppText>
        <AppText variant="caption" tone="muted">
          {label.toUpperCase()}
        </AppText>
      </View>
    </Card>
  );
}
