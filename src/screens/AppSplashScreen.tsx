import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { getAppColors } from '@/utils/theme';

/** Blank splash while app resources load. */
export function AppSplashScreen() {
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const backgroundColor = getAppColors(isDark).background;

  return <View style={[styles.root, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
