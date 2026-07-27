/**
 * Store du thème. Thème sombre par défaut, persistance via AsyncStorage.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import { palettes, type ThemeName, type ThemePalette } from '@/constants/theme';

interface ThemeState {
  name: ThemeName;
  colors: ThemePalette;
  hydrate: () => Promise<void>;
  setTheme: (name: ThemeName) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  name: 'dark',
  colors: palettes.dark,
  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(STORAGE_KEYS.theme)) as ThemeName | null;
    if (stored === 'dark' || stored === 'light') {
      set({ name: stored, colors: palettes[stored] });
    }
  },
  setTheme: (name) => {
    set({ name, colors: palettes[name] });
    void AsyncStorage.setItem(STORAGE_KEYS.theme, name);
  },
  toggle: () => {
    const next: ThemeName = get().name === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
