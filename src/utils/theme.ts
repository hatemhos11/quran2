import type { Theme as NavigationTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

const light = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#5D6D7E',
  arabic: '#1a1a1a',
  accent: '#1B5E20',
  accentMuted: '#00897B',
  cardShadow: 'rgba(44, 62, 80, 0.08)',
};

const dark = {
  background: '#0D1B2A',
  surface: '#1B2838',
  text: '#E8E8E8',
  textSecondary: '#B0BEC5',
  arabic: '#F5F5F5',
  accent: '#4CAF50',
  accentMuted: '#FFD700',
  cardShadow: 'rgba(0, 0, 0, 0.35)',
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
    colors: {
      ...base.colors,
      primary: c.accent,
      secondary: c.accentMuted,
      background: c.background,
      surface: c.surface,
      onSurface: c.text,
      onSurfaceVariant: c.textSecondary,
      outline: isDark ? '#37474F' : '#CFD8DC',
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
      border: isDark ? '#37474F' : '#E0E0E0',
      notification: c.accentMuted,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
}
