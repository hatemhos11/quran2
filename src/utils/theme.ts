import type { Theme as NavigationTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

const light = {
  // Surfaces
  background: '#F7F5EF',      // warm parchment
  surface: '#FFFFFF',
  surfaceElevated: '#FDFCF8',
  surfaceMuted: '#EFEBE1',

  // Text
  text: '#1C2A24',
  textSecondary: '#6B7A72',
  textTertiary: '#9AA69F',
  arabic: '#0F1A15',

  // Brand
  accent: '#0B6B4F',          // deep emerald
  accentSoft: '#E6F1EB',      // emerald tint for active row
  accentMuted: '#B8862B',     // antique gold for Makki tag
  accentMutedSoft: '#F4EAD1',

  // Structure
  border: '#E7E1D3',
  divider: '#EDE7D7',
  cardShadow: 'rgba(28, 42, 36, 0.06)',

  // Semantic tag colors
  madaniBg: '#E6F1EB',
  madaniFg: '#0B6B4F',
  makkiBg: '#F7ECD1',
  makkiFg: '#8A6318',
};

const dark = {
  background: '#0B1512',
  surface: '#111E1A',
  surfaceElevated: '#152722',
  surfaceMuted: '#1B302A',

  text: '#ECEFEC',
  textSecondary: '#9BB0A6',
  textTertiary: '#6B8078',
  arabic: '#F5F7F4',

  accent: '#34D399',          // luminous emerald for dark
  accentSoft: 'rgba(52, 211, 153, 0.12)',
  accentMuted: '#E0B96A',
  accentMutedSoft: 'rgba(224, 185, 106, 0.14)',

  border: '#1E332C',
  divider: '#17272220',
  cardShadow: 'rgba(0, 0, 0, 0.4)',

  madaniBg: 'rgba(52, 211, 153, 0.14)',
  madaniFg: '#6EE7B7',
  makkiBg: 'rgba(224, 185, 106, 0.14)',
  makkiFg: '#E0B96A',
};

export type AppColors = typeof light;

export function getAppColors(isDark: boolean): AppColors {
  return isDark ? dark : light;
}

export function buildPaperTheme(isDark: boolean): MD3Theme {
  const c = getAppColors(isDark);
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 14,
    colors: {
      ...base.colors,
      primary: c.accent,
      secondary: c.accentMuted,
      background: c.background,
      surface: c.surface,
      surfaceVariant: c.surfaceMuted,
      onSurface: c.text,
      onSurfaceVariant: c.textSecondary,
      outline: c.border,
      outlineVariant: c.divider,
    },
  };
}

export function buildNavigationTheme(isDark: boolean): NavigationTheme {
  const c = getAppColors(isDark);
  return {
    dark: isDark,
    colors: {
      primary: c.accent,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.accentMuted,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
    },
  };
}
