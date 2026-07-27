/** Carte : surface légèrement plus claire, coins arrondis, bordure subtile. */

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  padded?: boolean;
}

export function Card({ children, style, glow, padded = true }: CardProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: glow ? colors.accent : colors.border,
          padding: padded ? spacing.lg : 0,
        },
        glow && {
          shadowColor: colors.accent,
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
