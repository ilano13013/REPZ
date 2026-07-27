/** Barre de progression animée (Reanimated), avec dégradé d'accent. */

import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface ProgressBarProps {
  /** Progression [0, 1]. */
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ value, height = 10, color, trackColor, style }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 600 });
  }, [value, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor ?? colors.track,
          borderRadius: radius.pill,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: color ?? colors.accent,
            borderRadius: radius.pill,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
