/** Accès rapide à la palette de couleurs du thème courant. */

import { useThemeStore } from '@/stores/themeStore';
import { radius, spacing, typography } from '@/constants/theme';

export function useTheme() {
  const colors = useThemeStore((s) => s.colors);
  const name = useThemeStore((s) => s.name);
  return { colors, name, radius, spacing, typography };
}
