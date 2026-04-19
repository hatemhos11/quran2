import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = {
  title: string;
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, icon = 'book-open-page-variant', actionLabel, onAction }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <MaterialCommunityIcons name={icon} size={56} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.msg, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.btn}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  msg: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 20,
  },
});
