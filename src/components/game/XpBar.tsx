/** Barre d'XP globale avec niveau, titre et XP restante. */

import React from 'react';
import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import type { LevelState } from '@/engines/levelEngine';

interface XpBarProps {
  level: LevelState;
  compact?: boolean;
}

export function XpBar({ level, compact }: XpBarProps) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant={compact ? 'label' : 'h3'}>
          Niveau {level.level} · <AppText tone="accent" variant={compact ? 'label' : 'h3'}>{level.title}</AppText>
        </AppText>
        <AppText variant="caption" tone="muted">
          {level.xpForNext === 0 ? 'MAX' : `${level.xpRemaining} XP restants`}
        </AppText>
      </View>
      <ProgressBar value={level.progress} height={compact ? 8 : 12} />
    </View>
  );
}
