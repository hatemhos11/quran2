import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSurahList } from '../services/quranApi';
import { useCurrentSurahFromNav } from '../hooks/useCurrentSurahFromNav';
import { useQuranStore } from '../store/quranStore';
import type { SurahSummary } from '../types';
import { tokens } from '../utils/constants';

export function SurahDrawer(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { navigation } = props;
  const currentSurah = useCurrentSurahFromNav();
  const downloaded = useQuranStore((s) => s.downloadedSurahNumbers);
  const storeSurahs = useQuranStore((s) => s.surahs);
  const storeLoaded = useQuranStore((s) => s.surahsLoaded);

  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSurahList();
      setSurahs(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load surahs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeLoaded && storeSurahs.length) {
      setSurahs(storeSurahs);
      setLoading(false);
    } else {
      void load();
    }
  }, [load, storeLoaded, storeSurahs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number).includes(q) ||
        s.name.includes(query.trim())
    );
  }, [query, surahs]);

  const goToSurah = useCallback(
    (s: SurahSummary) => {
      navigation.navigate('Quran', {
        screen: 'SurahDetail',
        params: {
          surahNumber: s.number,
          surahName: `${s.number}. ${s.englishName}`,
        },
      });
      navigation.closeDrawer();
    },
    [navigation]
  );

  const isDownloaded = useCallback(
    (n: number) => downloaded.includes(n),
    [downloaded]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: theme.colors.background }]}>
      <Text style={[styles.header, { color: theme.colors.onSurface }]}>Surahs</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search name or number…"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[
          styles.search,
          {
            color: theme.colors.onSurface,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          },
        ]}
        accessibilityLabel="Search surahs"
        autoCorrect={false}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = currentSurah === item.number;
            const makki = item.revelationType === 'Meccan';
            return (
              <Pressable
                onPress={() => goToSurah(item)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? theme.colors.primaryContainer : 'transparent',
                    borderRadius: tokens.radius.sm,
                  },
                ]}
              >
                <Text style={[styles.rowNum, { color: theme.colors.onSurfaceVariant }]}>{item.number}</Text>
                <View style={styles.rowText}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.rowEn, { color: theme.colors.onSurface }]} numberOfLines={1}>
                      {item.englishName}
                    </Text>
                    <View
                      style={[
                        styles.pill,
                        { backgroundColor: makki ? theme.colors.secondaryContainer : theme.colors.tertiaryContainer },
                      ]}
                    >
                      <Text style={[styles.pillTxt, { color: theme.colors.onSecondaryContainer }]}>
                        {makki ? 'Makki' : 'Madani'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
                    {item.numberOfAyahs} ayahs
                  </Text>
                  <Text style={[styles.rowAr, { color: theme.colors.primary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isDownloaded(item.number) ? 'download-circle' : 'download-outline'}
                  size={22}
                  color={isDownloaded(item.number) ? theme.colors.primary : theme.colors.outline}
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  center: {
    padding: 24,
    alignItems: 'center',
  },
  error: {
    color: '#b91c1c',
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  rowNum: {
    width: 28,
    fontSize: 14,
  },
  rowText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowEn: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  meta: {
    fontSize: 11,
    marginTop: 2,
  },
  rowAr: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
