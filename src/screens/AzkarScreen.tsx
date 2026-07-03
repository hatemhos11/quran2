import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ar } from '@/i18n/ar';
import { useSettingsStore } from '@/store/settingsStore';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

export function AzkarScreen() {
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const c = getAppColors(isDark);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.content}>
        <Text variant="titleMedium" style={[styles.title, { color: c.text }]}>
          {ar.azkar}
        </Text>
        <Text variant="bodyMedium" style={{ color: c.textSecondary, textAlign: 'center' }}>
          {ar.comingSoon}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp.lg,
    gap: sp.sm,
  },
  title: { writingDirection: 'rtl' },
});
