/**
 * Layout racine : initialise la base de données, hydrate le thème et charge les
 * stores, puis monte la navigation. L'overlay de montée de niveau est global.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { initDatabase } from '@/db/database';
import { useThemeStore } from '@/stores/themeStore';
import { useProfileStore } from '@/stores/profileStore';
import { useGameStore } from '@/stores/gameStore';
import { useProgramStore } from '@/stores/programStore';
import { LevelUpOverlay } from '@/components/game/LevelUpOverlay';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const themeName = useThemeStore((s) => s.name);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await useThemeStore.getState().hydrate();
      await useProfileStore.getState().load();
      if (useProfileStore.getState().profile) {
        await useProgramStore.getState().load();
        await useGameStore.getState().load();
      }
      setReady(true);
    })().catch((e: unknown) => {
      console.error('Erreur d\'initialisation', e);
      setInitError(e instanceof Error ? e.message : String(e));
      setReady(true);
    });
  }, []);

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
          Stockage local indisponible
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
          REPZ enregistre tes données avec SQLite, qui nécessite un appareil mobile
          (Expo Go) ou un navigateur compatible WebAssembly.
        </Text>
        <Text style={{ color: colors.textFaint, marginTop: 16, fontSize: 12, textAlign: 'center' }}>
          {initError}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
        <LevelUpOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
