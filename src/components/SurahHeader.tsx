import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import type { SurahMeta } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
  surah: SurahMeta;
  isDark: boolean;
  showTransliteration: boolean;
};

export function SurahHeader({ surah, isDark, showTransliteration }: Props) {
  const c = getAppColors(isDark);
  const isMadani = surah.revelationType === 'Medinan';

  return (
    <View style={styles.wrap}>
      <Text
        variant="headlineMedium"
        style={[styles.arName, { color: c.arabic }]}
        accessibilityRole="header">
        {surah.name}
      </Text>
      {showTransliteration ? (
        <Text variant="titleMedium" style={[styles.en, { color: c.text }]}>
          {surah.englishName}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Chip
          mode="outlined"
          compact
          style={[styles.chip, { borderColor: c.accent }]}
          textStyle={{ color: c.accent }}>
          {ar.subAyahs(surah.numberOfAyahs)}
        </Chip>
        <Chip
          mode="flat"
          compact
          style={[
            styles.chip,
            { backgroundColor: isMadani ? `${c.accent}22` : `${c.accentMuted}22` },
          ]}
          textStyle={{ color: c.text }}>
          {isMadani ? ar.madani : ar.makki}
        </Chip>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: sp.lg,
    paddingTop: sp.xs,
    paddingBottom: sp.lg,
    gap: sp.sm,
    alignItems: 'center',
  },
  arName: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  en: { textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm, justifyContent: 'center' },
  chip: { alignSelf: 'center' },
});
