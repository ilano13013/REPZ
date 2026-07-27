/**
 * Animation de montée de niveau : apparition du nouveau niveau, particules,
 * vibration, compteur d'XP animé et bouton « voir les récompenses ».
 *
 * Se déclenche automatiquement quand `profileStore.pendingLevelUp` est défini.
 */

import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { Card } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore } from '@/stores/profileStore';

const PARTICLE_COUNT = 18;

function Particle({ index, color }: { index: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      120,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
    );
  }, [t]);

  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 120 + (index % 4) * 22;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      { translateY: Math.sin(angle) * distance * t.value },
      { scale: 1 - t.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function LevelUpOverlay() {
  const { colors, spacing } = useTheme();
  const pending = useProfileStore((s) => s.pendingLevelUp);
  const consume = useProfileStore((s) => s.consumeLevelUp);
  const [showRewards, setShowRewards] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);

  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!pending) return;
    setShowRewards(false);
    setDisplayLevel(pending.fromLevel);
    scale.value = 0;
    scale.value = withSequence(
      withSpring(1.15, { damping: 8 }),
      withTiming(1, { duration: 180 }),
    );
    glow.value = withTiming(1, { duration: 500 });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Compteur de niveau animé (from → to).
    const steps = Math.max(1, pending.toLevel - pending.fromLevel);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayLevel(pending.fromLevel + i);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (i >= steps) clearInterval(interval);
    }, 220);
    return () => clearInterval(interval);
  }, [pending, scale, glow]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.6 }));

  if (!pending) return null;

  const accents = [colors.accent, colors.accentSecondary, colors.accentTertiary, colors.gold];

  return (
    <Modal transparent animationType="fade" visible={!!pending}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 260 }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: colors.accent,
              },
              glowStyle,
            ]}
          />
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} color={accents[i % accents.length]} />
          ))}
          <Animated.View style={badgeStyle}>
            <AppText variant="caption" tone="accent" style={{ textAlign: 'center' }}>
              NIVEAU SUPÉRIEUR
            </AppText>
            <AppText variant="display" style={{ textAlign: 'center', fontSize: 96 }}>
              {displayLevel}
            </AppText>
          </Animated.View>
        </View>

        {pending.newTitle ? (
          <AppText variant="h2" tone="gold" style={{ marginTop: spacing.md }}>
            Titre débloqué : {pending.newTitle}
          </AppText>
        ) : null}

        {showRewards && pending.rewards.length > 0 ? (
          <Card style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Récompenses débloquées
            </AppText>
            {pending.rewards.map((r) => (
              <AppText key={r.level} tone="muted" style={{ marginBottom: 4 }}>
                • {r.label}
              </AppText>
            ))}
          </Card>
        ) : null}

        <View style={{ marginTop: spacing.xl, gap: spacing.sm, alignSelf: 'stretch' }}>
          {pending.rewards.length > 0 && !showRewards ? (
            <AppButton
              label="Voir les récompenses"
              variant="secondary"
              fullWidth
              onPress={() => setShowRewards(true)}
            />
          ) : null}
          <AppButton label="Continuer" fullWidth onPress={consume} />
        </View>
      </View>
    </Modal>
  );
}
