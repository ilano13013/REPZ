/**
 * Layout racine : initialise la base de données, hydrate le thème et charge les
 * stores, puis monte la navigation. L'overlay de montée de niveau est global.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { initDatabase } from '@/db/database';
import { useThemeStore } from '@/stores/themeStore';
import { useProfileStore } from '@/stores/profileStore';
import { useGameStore } from '@/stores/gameStore';
import { LevelUpOverlay } from '@/components/game/LevelUpOverlay';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const themeName = useThemeStore((s) => s.name);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await useThemeStore.getState().hydrate();
      await useProfileStore.getState().load();
      if (useProfileStore.getState().profile) {
        await useGameStore.getState().load();
      }
      setReady(true);
    })().catch((e) => {
      console.error('Erreur d\'initialisation', e);
      setReady(true);
    });
  }, []);

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
