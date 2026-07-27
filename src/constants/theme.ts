/**
 * Direction artistique « fitness gaming premium ».
 *
 * Thème sombre par défaut + thème clair. Les composants consomment ces palettes
 * via le `ThemeProvider` (voir `src/hooks/useTheme.ts`).
 */

export type ThemeName = 'dark' | 'light';

export interface ThemePalette {
  /** Fond principal de l'application (le plus sombre). */
  background: string;
  /** Fond légèrement surélevé (sections). */
  surface: string;
  /** Cartes, un cran plus clair que le fond. */
  card: string;
  /** Cartes surélevées / modales. */
  elevated: string;
  /** Bordures subtiles. */
  border: string;
  /** Texte principal. */
  text: string;
  /** Texte secondaire, atténué. */
  textMuted: string;
  /** Texte très atténué (légendes). */
  textFaint: string;
  /** Accent principal : vert électrique. */
  accent: string;
  /** Accent secondaire : violet. */
  accentSecondary: string;
  /** Accent tertiaire : bleu. */
  accentTertiary: string;
  /** Couleur de succès / gain. */
  success: string;
  /** Avertissement. */
  warning: string;
  /** Danger. */
  danger: string;
  /** Or (records, boss). */
  gold: string;
  /** Piste de barre de progression. */
  track: string;
}

const dark: ThemePalette = {
  background: '#0A0B0F',
  surface: '#101219',
  card: '#161923',
  elevated: '#1E222E',
  border: '#252A38',
  text: '#F5F7FA',
  textMuted: '#9BA3B4',
  textFaint: '#5B6274',
  accent: '#3BF07A',
  accentSecondary: '#8B5CF6',
  accentTertiary: '#38BDF8',
  success: '#3BF07A',
  warning: '#FBBF24',
  danger: '#F87171',
  gold: '#F5C542',
  track: '#20242F',
};

const light: ThemePalette = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  border: '#E2E6EE',
  text: '#0E1116',
  textMuted: '#5B6274',
  textFaint: '#9BA3B4',
  accent: '#10B981',
  accentSecondary: '#7C3AED',
  accentTertiary: '#0EA5E9',
  success: '#10B981',
  warning: '#D97706',
  danger: '#DC2626',
  gold: '#CA8A04',
  track: '#E7EBF2',
};

export const palettes: Record<ThemeName, ThemePalette> = { dark, light };

/** Rayons de coins arrondis. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Échelle d'espacement (base 4). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

/** Typographie. */
export const typography = {
  display: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 19, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
  /** Grands chiffres lisibles pendant la séance. */
  metric: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1 },
} as const;

export const shadow = {
  glow: {
    shadowColor: dark.accent,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;
