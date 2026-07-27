/**
 * Petit toast animé « +24 XP » affiché après validation d'une série, et
 * variante spéciale « Nouveau record personnel ».
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { AppText } from '../ui/AppText';
import { useTheme } from '@/hooks/useTheme';

interface XpGainToastProps {
  xp: number;
  isRecord: boolean;
  onDone: () => void;
}

export function XpGainToast({ xp, isRecord, onDone }: XpGainToastProps) {
  const { colors, spacing, radius } = useTheme();
  const y = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withDelay(1100, withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
    y.value = withTiming(-8, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [xp, isRecord, opacity, y, onDone]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: '40%',
          alignSelf: 'center',
          alignItems: 'center',
          zIndex: 50,
        },
        style,
      ]}
    >
      {isRecord ? (
        <View
          style={{
            backgroundColor: colors.gold,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
            marginBottom: spacing.sm,
          }}
        >
          <AppText variant="label" style={{ color: '#1A1200' }}>
            🏆 NOUVEAU RECORD PERSONNEL
          </AppText>
        </View>
      ) : null}
      <AppText variant="display" tone="accent" style={{ fontSize: 56 }}>
        +{xp} XP
      </AppText>
    </Animated.View>
  );
}
