import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
  isDark: boolean;
  title: string;
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRetry?: () => void;
  retryLabel?: string;
};

export function EmptyState({
  isDark,
  title,
  message,
  icon = 'book-open-page-variant',
  onRetry,
  retryLabel,
}: Props) {
  const resolvedRetryLabel = retryLabel ?? ar.tryAgain;
  const c = getAppColors(isDark);
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={48} color={c.accent} style={styles.icon} />
      <Text variant="titleLarge" style={[styles.title, { color: c.text }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.msg, { color: c.textSecondary }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} style={styles.btn} accessibilityLabel={resolvedRetryLabel}>
          {resolvedRetryLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp.xl,
    gap: sp.md,
  },
  icon: { marginBottom: sp.xs },
  title: { textAlign: 'center' },
  msg: { textAlign: 'center', maxWidth: 300 },
  btn: { marginTop: sp.sm, minHeight: 40 },
});
