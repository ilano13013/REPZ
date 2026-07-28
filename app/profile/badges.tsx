/**
 * Collection de badges : condition de déblocage, rareté et date d'obtention.
 * Les badges non obtenus restent visibles (grisés) pour donner un objectif.
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useProfileStore } from '@/stores/profileStore';
import { BADGES } from '@/data/badges';
import { formatDate } from '@/utils/date';
import type { BadgeDefinition } from '@/models';

const RARITY_LABEL: Record<BadgeDefinition['rarity'], string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export default function Badges() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const owned = useProfileStore((s) => s.badges);

  const rarityColor: Record<BadgeDefinition['rarity'], string> = {
    common: colors.textMuted,
    rare: colors.accentTertiary,
    epic: colors.accentSecondary,
    legendary: colors.gold,
  };

  const unlockedCount = BADGES.filter((b) => owned.some((u) => u.badgeId === b.id)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h1">Badges</AppText>
          <AppButton label="Fermer" variant="ghost" onPress={() => router.back()} />
        </View>

        <Card glow>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <AppText variant="h2">{unlockedCount} / {BADGES.length}</AppText>
            <AppText variant="caption" tone="muted">DÉBLOQUÉS</AppText>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={unlockedCount / BADGES.length} />
          </View>
        </Card>

        <View style={{ gap: spacing.md }}>
          {BADGES.map((badge) => {
            const unlock = owned.find((u) => u.badgeId === badge.id);
            const isOwned = !!unlock;
            return (
              <Card key={badge.id} style={{ opacity: isOwned ? 1 : 0.55 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: colors.elevated,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: isOwned ? rarityColor[badge.rarity] : colors.border,
                    }}
                  >
                    <AppText style={{ fontSize: 26, opacity: isOwned ? 1 : 0.35 }}>{badge.icon}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="h3">{badge.name}</AppText>
                      <AppText variant="caption" style={{ color: rarityColor[badge.rarity] }}>
                        {RARITY_LABEL[badge.rarity].toUpperCase()}
                      </AppText>
                    </View>
                    <AppText variant="label" tone="muted">{badge.description}</AppText>
                    <AppText variant="caption" tone={isOwned ? 'success' : 'faint'} style={{ marginTop: 2 }}>
                      {isOwned ? `✓ Obtenu le ${formatDate(unlock.unlockedAt)}` : 'À débloquer'}
                    </AppText>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
