import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
  isDark: boolean;
  count?: number;
};

function SkeletonLine({
  isDark,
  widthPct,
  loadingLabel,
}: {
  isDark: boolean;
  widthPct: number;
  loadingLabel: string;
}) {
  const c = getAppColors(isDark);
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.line,
        {
          width: `${widthPct}%`,
          backgroundColor: isDark ? '#2c3e50' : '#e0e0e0',
          opacity: pulse,
        },
      ]}
      accessibilityLabel={loadingLabel}
    />
  );
}

export function LoadingSkeleton({ isDark, count = 6 }: Props) {
  const c = getAppColors(isDark);
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]} accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine
          key={i}
          isDark={isDark}
          widthPct={85 - (i % 3) * 10}
          loadingLabel={ar.loadingLabel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sp.lg,
    marginVertical: sp.md,
    padding: sp.xl,
    borderRadius: sp.md,
    gap: sp.lg,
  },
  line: {
    height: 14,
    borderRadius: 4,
  },
});
