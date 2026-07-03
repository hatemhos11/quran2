import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, List, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ar } from '@/i18n/ar';
import type { SettingsStackParamList } from '@/navigation/types';
import { useReciterStore } from '@/store/reciterStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { AudioReciter } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ReciterPicker'>;

export function ReciterPickerScreen({ navigation }: Props) {
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const c = getAppColors(isDark);
  const preferredReciter = useSettingsStore((s) => s.preferredReciter);
  const setPreferredReciter = useSettingsStore((s) => s.setPreferredReciter);

  const reciters = useReciterStore((s) => s.reciters);
  const loading = useReciterStore((s) => s.loading);
  const error = useReciterStore((s) => s.error);
  const loadReciters = useReciterStore((s) => s.loadReciters);

  const [query, setQuery] = useState('');

  useEffect(() => {
    void loadReciters();
  }, [loadReciters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reciters;
    return reciters.filter(
      (r) =>
        r.name.includes(query) ||
        r.englishName.toLowerCase().includes(q) ||
        r.identifier.toLowerCase().includes(q)
    );
  }, [query, reciters]);

  const onSelect = useCallback(
    (reciter: AudioReciter) => {
      setPreferredReciter(reciter.identifier);
      navigation.goBack();
    },
    [navigation, setPreferredReciter]
  );

  const renderItem = useCallback(
    ({ item }: { item: AudioReciter }) => (
      <List.Item
        title={item.name}
        description={item.englishName}
        titleStyle={{ color: c.text, writingDirection: 'rtl', textAlign: 'right' }}
        descriptionStyle={{ color: c.textSecondary, textAlign: 'right' }}
        onPress={() => onSelect(item)}
        right={() =>
          preferredReciter === item.identifier ? (
            <List.Icon icon="check" color={c.accent} />
          ) : null
        }
      />
    ),
    [c.accent, c.text, c.textSecondary, onSelect, preferredReciter]
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <Appbar.Header style={[styles.appBarHeader, { backgroundColor: c.surface }]}>
        <Appbar.BackAction onPress={() => navigation.goBack()} accessibilityLabel={ar.settings} />
        <Appbar.Content
          title={ar.reciterPickerTitle}
          titleStyle={{ color: c.text, textAlign: 'center', writingDirection: 'rtl' }}
        />
      </Appbar.Header>

      <View style={styles.searchWrap}>
        <Searchbar
          placeholder={ar.reciterSearchPlaceholder}
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: isDark ? '#243447' : '#EEF2F0' }]}
          inputStyle={{ color: c.text, textAlign: 'right', writingDirection: 'rtl' }}
          iconColor={c.textSecondary}
          placeholderTextColor={c.textSecondary}
          elevation={0}
        />
      </View>

      {loading && reciters.length === 0 ? (
        <LoadingSkeleton isDark={isDark} />
      ) : error ? (
        <EmptyState
          isDark={isDark}
          title={ar.somethingWrong}
          message={ar.reciterLoadError}
          onRetry={() => void loadReciters(true)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.identifier}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textSecondary }]}>{ar.reciterNoResults}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appBarHeader: { direction: 'ltr' },
  searchWrap: {
    paddingHorizontal: sp.lg,
    paddingVertical: sp.sm,
  },
  search: {
    borderRadius: 14,
  },
  listContent: {
    paddingBottom: sp.xxl,
  },
  empty: {
    textAlign: 'center',
    marginTop: sp.xxl,
    writingDirection: 'rtl',
  },
});
