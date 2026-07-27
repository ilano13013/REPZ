/** Sélection d'un exercice à ajouter (ou remplacer) dans la séance en cours. */

import React, { useState } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { useSessionStore } from '@/stores/sessionStore';
import { EXERCISES } from '@/data/exercises';
import { MUSCLES } from '@/data/muscles';

export default function PickExercise() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const params = useLocalSearchParams<{ replace?: string }>();
  const [query, setQuery] = useState('');

  const filtered = EXERCISES.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()),
  );

  const choose = (exerciseId: string) => {
    if (params.replace) {
      useSessionStore.getState().replaceExercise(params.replace, exerciseId);
    } else {
      useSessionStore.getState().addExercise(exerciseId);
    }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h2">{params.replace ? 'Remplacer' : 'Ajouter'} un exercice</AppText>
          <Pressable onPress={() => router.back()}>
            <AppText tone="muted" variant="label">Fermer</AppText>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textFaint}
          style={{
            backgroundColor: colors.elevated, borderRadius: radius.md, color: colors.text,
            paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16,
          }}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.sm }}>
            {filtered.map((e) => (
              <Pressable key={e.id} onPress={() => choose(e.id)}>
                <Card padded={false} style={{ padding: spacing.md }}>
                  <AppText variant="label">{e.name}</AppText>
                  <AppText variant="caption" tone="muted">
                    {MUSCLES[e.primaryMuscle].label} · {e.difficulty}
                  </AppText>
                </Card>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
