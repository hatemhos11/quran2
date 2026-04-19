import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { getArabicFontFamily } from '../services/fontLoader';
import type { ArabicFontId, AyahText } from '../types';
import { tokens } from '../utils/constants';

type Props = {
  ayah: AyahText;
  translation?: string;
  arabicFontSize: number;
  arabicFontId: ArabicFontId;
  showTransliteration: boolean;
  onPress: () => void;
};

function AyahCardInner({
  ayah,
  translation,
  arabicFontSize,
  arabicFontId,
  showTransliteration,
  onPress,
}: Props) {
  const theme = useTheme();
  const ff = getArabicFontFamily(arabicFontId);
  const lineHeight = arabicFontSize * 2.3;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: '#00000044',
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ayah ${ayah.numberInSurah}`}
    >
      <View style={styles.row}>
        <View style={styles.arabicCol}>
          <Text
            style={[
              styles.arabic,
              {
                color: theme.colors.onSurface,
                fontSize: arabicFontSize,
                lineHeight,
                letterSpacing: 0.3,
                fontFamily: ff,
              },
            ]}
          >
            {ayah.text}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.badgeNum, { color: theme.colors.primary }]}>{ayah.numberInSurah}</Text>
        </View>
      </View>
      {showTransliteration && translation ? (
        <Text style={[styles.tr, { color: theme.colors.onSurfaceVariant, fontSize: Math.max(14, arabicFontSize - 10) }]}>
          {translation}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const AyahCard = memo(AyahCardInner);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space.sm,
    marginBottom: tokens.space.md,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    minHeight: tokens.minTouch,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  arabicCol: {
    flex: 1,
  },
  arabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  tr: {
    marginTop: 12,
    lineHeight: 22,
  },
});
