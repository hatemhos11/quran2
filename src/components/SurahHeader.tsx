import { StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { BISMILLAH_TEXT, SURAH_AT_TAWBAH } from '../utils/constants';
import type { SurahSummary } from '../types';
import { getArabicFontFamily } from '../services/fontLoader';
import type { ArabicFontId } from '../types';
import { tokens } from '../utils/constants';

type Props = {
  surah: SurahSummary;
  arabicFontSize: number;
  arabicFontId: ArabicFontId;
};

export function SurahHeader({ surah, arabicFontSize, arabicFontId }: Props) {
  const theme = useTheme();
  const ff = getArabicFontFamily(arabicFontId);

  const showBismillah = surah.number !== SURAH_AT_TAWBAH;

  return (
    <View style={[styles.block, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.nameAr, { color: theme.colors.primary, fontSize: arabicFontSize + 6 }, ff && { fontFamily: ff }]}>
        {surah.name}
      </Text>
      <Text variant="titleMedium" style={[styles.nameEn, { color: theme.colors.onSurface }]}>
        {surah.englishName}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {surah.englishNameTranslation}
      </Text>
      <View style={styles.row}>
        <Chip compact style={styles.chip}>
          {surah.numberOfAyahs} ayahs
        </Chip>
        <Chip compact style={styles.chip} mode="outlined">
          {surah.revelationType}
        </Chip>
      </View>
      {showBismillah ? (
        <Text
          style={[
            styles.bismillah,
            {
              color: theme.colors.onSurface,
              fontSize: arabicFontSize,
              lineHeight: arabicFontSize * 2.2,
              fontFamily: ff,
            },
          ]}
        >
          {BISMILLAH_TEXT}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    padding: tokens.space.md,
    marginBottom: tokens.space.sm,
    borderRadius: tokens.radius.md,
    marginHorizontal: tokens.space.sm,
    elevation: 1,
  },
  nameAr: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  nameEn: {
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    marginVertical: 2,
  },
  bismillah: {
    marginTop: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
