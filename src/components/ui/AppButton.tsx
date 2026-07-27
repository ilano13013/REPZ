/** Bouton thématique avec retour haptique et variantes. */

import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  fullWidth,
  haptic = true,
  style,
}: AppButtonProps) {
  const { colors, radius, spacing } = useTheme();

  const bg: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: colors.elevated,
    ghost: 'transparent',
    danger: colors.danger,
  };
  const fg: Record<ButtonVariant, string> = {
    primary: '#04140A',
    secondary: colors.text,
    ghost: colors.accent,
    danger: '#FFFFFF',
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg[variant],
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.accent,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <AppText variant="label" style={{ color: fg[variant], fontSize: 15 }}>
        {label}
      </AppText>
    </Pressable>
  );
}
