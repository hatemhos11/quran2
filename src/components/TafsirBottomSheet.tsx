import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import { apiFetchTafsir } from '@/services/quranApi';
import { loadTafsirOffline } from '@/services/offlineStorage';
import { useSettingsStore } from '@/store/settingsStore';
import type { Ayah, TafsirEdition } from '@/types';
import { TAFSIR_SOURCES } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

export type TafsirSheetRef = BottomSheetModal;

type Props = {
  isDark: boolean;
  isOnline: boolean;
  surahNumber: number;
  surahEnglishName: string;
  ayah: Ayah | null;
  onDismiss: () => void;
};

export const TafsirBottomSheet = forwardRef<BottomSheetModal, Props>(function TafsirBottomSheet(
  { isDark, isOnline, surahNumber, surahEnglishName, ayah, onDismiss },
  ref
) {
  const c = getAppColors(isDark);
  const preferred = useSettingsStore((s) => s.preferredTafsir);
  const [source, setSource] = useState<TafsirEdition>(preferred);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSource(preferred);
  }, [preferred]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ayah) {
        setBody('');
        return;
      }
      setLoading(true);
      setBody('');
      try {
        const local = await loadTafsirOffline(surahNumber, ayah.numberInSurah, source);
        if (!cancelled && local) {
          setBody(local);
          setLoading(false);
          return;
        }
        if (!isOnline) {
          if (!cancelled) setBody(ar.tafsirOfflineUnavailable);
          if (!cancelled) setLoading(false);
          return;
        }
        const remote = await apiFetchTafsir(ayah.numberInQuran, source);
        if (!cancelled) setBody(remote || ar.noTafsir);
      } catch {
        if (!cancelled) setBody(ar.tafsirLoadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ayah, source, isOnline, surahNumber]);

  const backdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    []
  );

  const snapPoints = useMemo(() => ['48%', '88%'], []);

  const onCopy = async () => {
    if (!ayah) return;
    const block = `${ayah.text}\n\n${body}`;
    await Clipboard.setStringAsync(block);
  };

  const onShare = async () => {
    if (!ayah) return;
    await Share.share({
      message: `${ayah.text}\n\n— ${surahEnglishName} ${surahNumber}:${ayah.numberInSurah}\n\n${body}`,
    });
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={backdrop}
      onDismiss={onDismiss}
      handleIndicatorStyle={{ backgroundColor: c.textSecondary }}
      backgroundStyle={{ backgroundColor: c.surface }}>
      <BottomSheetScrollView
        contentContainerStyle={styles.sheetPad}
        keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={{ color: c.text, marginBottom: sp.sm, writingDirection: 'rtl' }}>
          {ar.tafsir}
        </Text>
        {ayah ? (
          <>
            <Text
              style={[
                styles.highlightAyah,
                {
                  color: c.arabic,
                  borderColor: c.accent,
                  backgroundColor: isDark ? '#0d1b2a' : '#f5f5dc',
                },
              ]}>
              {ayah.text}
            </Text>
            <SegmentedButtons
              value={source}
              onValueChange={(v) => setSource(v as TafsirEdition)}
              style={styles.seg}
              buttons={TAFSIR_SOURCES.map((s) => ({
                value: s.id,
                label: s.label,
              }))}
            />
            {loading ? (
              <ActivityIndicator color={c.accent} style={{ marginVertical: sp.lg }} />
            ) : (
              <Text variant="bodyLarge" style={[styles.tafsirBody, { color: c.text, writingDirection: 'rtl' }]}>
                {body || '—'}
              </Text>
            )}
            <View style={styles.actions}>
              <Button mode="contained-tonal" onPress={onCopy} icon="content-copy">
                {ar.copy}
              </Button>
              <Button mode="outlined" onPress={onShare} icon="share-variant">
                {ar.share}
              </Button>
            </View>
          </>
        ) : (
          <Text style={{ color: c.textSecondary, writingDirection: 'rtl' }}>{ar.selectAyah}</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

TafsirBottomSheet.displayName = 'TafsirBottomSheet';

const styles = StyleSheet.create({
  sheetPad: {
    paddingHorizontal: sp.xl,
    paddingBottom: sp.xxl + sp.md,
  },
  highlightAyah: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    writingDirection: 'rtl',
    padding: sp.md,
    borderRadius: sp.md,
    borderWidth: 1,
    marginBottom: sp.md,
  },
  tafsirBody: {
    lineHeight: 24,
    marginTop: sp.sm,
  },
  seg: { marginVertical: sp.sm },
  actions: {
    flexDirection: 'row',
    gap: sp.md,
    marginTop: sp.lg,
    flexWrap: 'wrap',
  },
});
