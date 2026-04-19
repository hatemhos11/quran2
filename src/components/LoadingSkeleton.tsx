import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

type Props = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 8 }: Props) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.wrap} accessibilityLabel="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.row,
            {
              opacity,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    gap: 12,
  },
  row: {
    height: 56,
    borderRadius: 12,
  },
});
