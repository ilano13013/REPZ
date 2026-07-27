/**
 * Défis : quêtes quotidiennes et hebdomadaires (avec récupération de la
 * récompense), boss de la semaine et classement de ligue (profils fictifs).
 */

import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BossCard } from '@/components/game/BossCard';
import { useTheme } from '@/hooks/useTheme';
import { useGameStore, divisionForScore } from '@/stores/gameStore';
import { QUESTS_BY_ID } from '@/data/quests';
import { DIVISION_LABEL } from '@/engines/leagueEngine';
import type { UserQuest } from '@/models';

function QuestItem({ quest }: { quest: UserQuest }) {
  const { spacing } = useTheme();
  const def = QUESTS_BY_ID[quest.questId];
  const claim = useGameStore((s) => s.claimQuest);
  if (!def) return null;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="label" tone={quest.completed ? 'success' : 'default'}>
            {quest.completed ? '✓ ' : ''}{def.title}
          </AppText>
          <AppText variant="caption" tone="muted">{def.description}</AppText>
        </View>
        {quest.completed && !quest.claimed ? (
          <AppButton label={`+${def.rewardXp}`} onPress={() => claim(quest.id)} />
        ) : (
          <AppText variant="caption" tone={quest.claimed ? 'faint' : 'gold'}>
            {quest.claimed ? 'Récupéré' : `+${def.rewardXp} XP`}
          </AppText>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ProgressBar value={quest.progress / quest.target} height={6} style={{ flex: 1 }} />
        <AppText variant="caption" tone="muted">{Math.round(quest.progress)}/{quest.target}</AppText>
      </View>
    </View>
  );
}

export default function Challenges() {
  const { colors, spacing } = useTheme();
  const daily = useGameStore((s) => s.dailyQuests);
  const weekly = useGameStore((s) => s.weeklyQuests);
  const boss = useGameStore((s) => s.boss);
  const league = useGameStore((s) => s.league);

  const userMember = league.find((m) => m.isUser);
  const division = userMember ? divisionForScore(userMember.score) : 'iron';

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg, gap: spacing.lg }}>
        <AppText variant="h1">Défis</AppText>

        {boss ? <BossCard boss={boss} /> : null}

        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Quêtes du jour</AppText>
          <View style={{ gap: spacing.lg }}>
            {daily.map((q) => <QuestItem key={q.id} quest={q} />)}
          </View>
        </Card>

        <Card>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>Quêtes de la semaine</AppText>
          <View style={{ gap: spacing.lg }}>
            {weekly.map((q) => <QuestItem key={q.id} quest={q} />)}
          </View>
        </Card>

        {/* Ligue */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <AppText variant="h3">Ligue {DIVISION_LABEL[division]}</AppText>
            <AppText variant="caption" tone="muted">Basé sur la progression & l'assiduité</AppText>
          </View>
          <View style={{ gap: spacing.sm }}>
            {league.map((m, i) => (
              <View
                key={m.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  padding: spacing.sm, borderRadius: 10,
                  backgroundColor: m.isUser ? colors.elevated : 'transparent',
                  borderWidth: m.isUser ? 1 : 0, borderColor: colors.accent,
                }}
              >
                <AppText variant="label" tone="muted" style={{ width: 24 }}>{i + 1}</AppText>
                <AppText variant="label" tone={m.isUser ? 'accent' : 'default'} style={{ flex: 1 }}>
                  {m.name}{m.isUser ? ' (toi)' : ''}
                </AppText>
                <AppText variant="label" tone="muted">{Math.round(m.score)}</AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}
