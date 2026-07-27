/** Texte thématique avec variantes typographiques. */

import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/theme';

type Variant = keyof typeof typography;
type Tone = 'default' | 'muted' | 'faint' | 'accent' | 'success' | 'danger' | 'gold';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  style?: TextStyle | TextStyle[];
}

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    faint: colors.textFaint,
    accent: colors.accent,
    success: colors.success,
    danger: colors.danger,
    gold: colors.gold,
  };
  return (
    <Text
      {...rest}
      style={[typography[variant] as TextStyle, { color: toneColor[tone] }, style as TextStyle]}
    />
  );
}
