/**
 * Constructeur / éditeur de programme personnalisé.
 *
 * Permet de renommer le programme, d'ajouter/supprimer des jours, et
 * d'ajouter, retirer ou réorganiser les exercices de chaque jour. Un exercice
 * prédéfini ouvert ici est en lecture seule (dupliquer pour le modifier).
 */

import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import {
  useProgramStore,
  addExerciseToDay,
  removeExerciseFromDay,
  moveExercise,
  addDay,
  removeDay,
  duplicateDay,
} from '@/stores/programStore';
import { getExercise, EXERCISES } from '@/data/exercises';
import { MUSCLES } from '@/data/muscles';
import type { Program } from '@/models';

export default function ProgramBuilder() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const source = useProgramStore((s) => s.getById(params.id));

  const [draft, setDraft] = useState<Program | null>(source ?? null);
  const [pickingDayId, setPickingDayId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const readOnly = draft?.isPreset ?? false;

  const filtered = useMemo(
    () => EXERCISES.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  if (!draft) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <AppText>Programme introuvable.</AppText>
        <AppButton label="Retour" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const save = async () => {
    await useProgramStore.getState().save(draft);
    Alert.alert('Enregistré', 'Programme mis à jour.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const duplicate = async () => {
    const copy = await useProgramStore.getState().duplicate(draft.id);
    if (copy) router.replace({ pathname: '/program/[id]', params: { id: copy.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h1">{readOnly ? 'Programme' : 'Éditer'}</AppText>
          <AppButton label="Fermer" variant="ghost" onPress={() => router.back()} />
        </View>

        {readOnly ? (
          <Card>
            <AppText variant="h3">{draft.name}</AppText>
            <AppText tone="muted" variant="label" style={{ marginVertical: spacing.sm }}>
              Programme prédéfini (lecture seule). Duplique-le pour le personnaliser.
            </AppText>
            <AppButton label="Dupliquer & modifier" onPress={duplicate} />
          </Card>
        ) : (
          <Card>
            <AppText variant="label" tone="muted">Nom du programme</AppText>
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              style={{
                color: colors.text, fontSize: 20, fontWeight: '700',
                borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm,
              }}
            />
          </Card>
        )}

        {/* Jours */}
        {draft.days.map((day) => (
          <Card key={day.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {readOnly ? (
                <AppText variant="h3">{day.name}</AppText>
              ) : (
                <TextInput
                  value={day.name}
                  onChangeText={(t) =>
                    setDraft({ ...draft, days: draft.days.map((d) => (d.id === day.id ? { ...d, name: t } : d)) })
                  }
                  style={{ color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 }}
                />
              )}
              {!readOnly ? (
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <Pressable onPress={() => setDraft(duplicateDay(draft, day.id))}>
                    <AppText tone="accent" variant="caption">Dupliquer</AppText>
                  </Pressable>
                  {draft.days.length > 1 ? (
                    <Pressable onPress={() => setDraft(removeDay(draft, day.id))}>
                      <AppText tone="danger" variant="caption">Supprimer</AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {day.exercises.map((t, i) => (
                <View key={`${t.exerciseId}_${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{getExercise(t.exerciseId)?.name ?? t.exerciseId}</AppText>
                    <AppText variant="caption" tone="muted">{t.sets}×{t.targetReps} · repos {t.restSeconds}s</AppText>
                  </View>
                  {!readOnly ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      <Pressable onPress={() => setDraft(moveExercise(draft, day.id, i, -1))}><AppText tone="muted">▲</AppText></Pressable>
                      <Pressable onPress={() => setDraft(moveExercise(draft, day.id, i, 1))}><AppText tone="muted">▼</AppText></Pressable>
                      <Pressable onPress={() => setDraft(removeExerciseFromDay(draft, day.id, i))}><AppText tone="danger">✕</AppText></Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
              {day.exercises.length === 0 ? (
                <AppText tone="faint" variant="caption">Aucun exercice.</AppText>
              ) : null}
            </View>

            {!readOnly ? (
              <Pressable onPress={() => { setPickingDayId(day.id); setQuery(''); }} style={{ marginTop: spacing.md }}>
                <AppText tone="accent" variant="label">+ Ajouter un exercice</AppText>
              </Pressable>
            ) : null}
          </Card>
        ))}

        {!readOnly ? (
          <>
            <AppButton label="+ Ajouter un jour" variant="secondary" fullWidth onPress={() => setDraft(addDay(draft))} />
            <AppButton label="💾 Enregistrer le programme" fullWidth onPress={save} />
          </>
        ) : null}
      </ScrollView>

      {/* Sélecteur d'exercice */}
      <Modal visible={pickingDayId != null} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="h2">Ajouter un exercice</AppText>
              <Pressable onPress={() => setPickingDayId(null)}><AppText tone="muted" variant="label">Fermer</AppText></Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher…"
              placeholderTextColor={colors.textFaint}
              style={{ backgroundColor: colors.elevated, borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md }}
            />
            <ScrollView>
              <View style={{ gap: spacing.sm }}>
                {filtered.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      if (pickingDayId) setDraft(addExerciseToDay(draft, pickingDayId, e.id));
                      setPickingDayId(null);
                    }}
                  >
                    <Card padded={false} style={{ padding: spacing.md }}>
                      <AppText variant="label">{e.name}</AppText>
                      <AppText variant="caption" tone="muted">{MUSCLES[e.primaryMuscle].label}</AppText>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
