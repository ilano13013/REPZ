/** Champ de saisie thématique avec libellé et message d'erreur. */

import React from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  suffix?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  suffix,
}: TextFieldProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="muted">{label}</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.elevated,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          style={{ flex: 1, color: colors.text, paddingVertical: spacing.md, fontSize: 16 }}
        />
        {suffix ? <AppText tone="faint">{suffix}</AppText> : null}
      </View>
      {error ? <AppText variant="caption" tone="danger">{error}</AppText> : null}
    </View>
  );
}
