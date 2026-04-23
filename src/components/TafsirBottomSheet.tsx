import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';

import * as Haptics from 'expo-haptics';

import { ar } from '@/i18n/ar';
import { apiFetchTafsir } from '@/services/quranApi';
import { loadTafsirOffline } from '@/services/offlineStorage';
import type { Ayah } from '@/types';
import { MUYASSAR_TAFSIR_ID } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

export type TafsirSheetRef = BottomSheetModal;

type Props = {
  isDark: boolean;
  isOnline: boolean;
  surahNumber: number;
  surahEnglishName: string;
  ayah: Ayah | null;
  /** Whether the open ayah is currently pinned. */
  ayahIsPinned: boolean;
  onTogglePin: () => void;
  onDismiss: () => void;
};

export const TafsirBottomSheet = forwardRef<BottomSheetModal, Props>(function TafsirBottomSheet(
  { isDark, isOnline, surahNumber, surahEnglishName, ayah, ayahIsPinned, onTogglePin, onDismiss },
  ref
) {
  const c = getAppColors(isDark);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const onPressPin = useCallback(() => {
    onTogglePin();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [onTogglePin]);

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
        const local = await loadTafsirOffline(
          surahNumber,
          ayah.numberInSurah,
          MUYASSAR_TAFSIR_ID
        );
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
        const remote = await apiFetchTafsir(ayah.numberInQuran, MUYASSAR_TAFSIR_ID);
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
  }, [ayah, isOnline, surahNumber]);

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
        <View style={styles.sheetHeader}>
          <Text
            variant="titleMedium"
            style={{ color: c.text, flex: 1, writingDirection: 'rtl' }}>
            {ar.tafsirMuyassarTitle}
          </Text>
          {ayah ? (
            <IconButton
              icon={ayahIsPinned ? 'pin' : 'pin-outline'}
              onPress={onPressPin}
              iconColor={ayahIsPinned ? c.accent : c.textSecondary}
              accessibilityLabel={ayahIsPinned ? ar.unpinAyahA11y : ar.pinAyahA11y}
            />
          ) : null}
        </View>
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
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: sp.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: sp.md,
    marginTop: sp.lg,
    flexWrap: 'wrap',
  },
});
