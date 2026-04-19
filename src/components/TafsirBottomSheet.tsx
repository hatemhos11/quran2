import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAyahTafsir } from '../services/quranApi';
import { getTafsirFromDatabase } from '../services/offlineStorage';
import { useSettingsStore } from '../store/settingsStore';
import { TAFSIR_SOURCES } from '../utils/constants';

type Props = {
  surahNumber: number | null;
  ayahInSurah: number | null;
  arabicPreview: string;
  translationPreview?: string;
  onDismiss: () => void;
};

export const TafsirBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ surahNumber, ayahInSurah, arabicPreview, translationPreview, onDismiss }, ref) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const preferredTafsir = useSettingsStore((s) => s.preferredTafsir);
    const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);

    const [source, setSource] = useState(preferredTafsir);
    const [text, setText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const snapPoints = useMemo(() => ['45%', '88%'], []);

    const load = useCallback(async () => {
      if (surahNumber == null || ayahInSurah == null) return;
      setLoading(true);
      setError(null);
      setText(null);
      try {
        const local = await getTafsirFromDatabase(surahNumber, ayahInSurah, source);
        if (local) {
          setText(local);
          return;
        }
        const res = await fetchAyahTafsir(surahNumber, ayahInSurah, source);
        const ayah = res.data?.[0]?.ayahs?.[0];
        setText(ayah?.text ?? 'No tafsir text returned.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load tafsir');
      } finally {
        setLoading(false);
      }
    }, [surahNumber, ayahInSurah, source]);

    useEffect(() => {
      if (surahNumber != null && ayahInSurah != null) {
        void load();
      }
    }, [surahNumber, ayahInSurah, source, load]);

    useEffect(() => {
      setSource(preferredTafsir);
    }, [preferredTafsir, surahNumber, ayahInSurah]);

    const copyAyah = useCallback(() => {
      const block = [arabicPreview, translationPreview].filter(Boolean).join('\n\n');
      Clipboard.setString(block);
    }, [arabicPreview, translationPreview]);

    const shareAyah = useCallback(async () => {
      const block = [arabicPreview, translationPreview].filter(Boolean).join('\n\n');
      await Share.share({ message: block, title: `Quran ${surahNumber}:${ayahInSurah}` });
    }, [arabicPreview, ayahInSurah, surahNumber, translationPreview]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={onDismiss}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={[styles.ref, { color: theme.colors.primary }]}>
            {surahNumber}:{ayahInSurah}
          </Text>
          <Text
            style={[
              styles.arPreview,
              {
                color: theme.colors.onSurface,
                fontSize: Math.min(arabicFontSize, 26),
                lineHeight: arabicFontSize * 2.2,
              },
            ]}
          >
            {arabicPreview}
          </Text>
          {translationPreview ? (
            <Text style={[styles.trPreview, { color: theme.colors.onSurfaceVariant }]}>{translationPreview}</Text>
          ) : null}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={copyAyah} icon="content-copy">
              Copy
            </Button>
            <Button mode="outlined" onPress={shareAyah} icon="share-variant">
              Share
            </Button>
          </View>

          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            Tafsir
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TAFSIR_SOURCES.map((s) => (
              <Chip
                key={s.id}
                selected={source === s.id}
                onPress={() => setSource(s.id)}
                style={styles.chip}
                mode={source === s.id ? 'flat' : 'outlined'}
              >
                {s.label}
              </Chip>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={[styles.content, { color: theme.colors.onSurface }]}>{text}</Text>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

TafsirBottomSheet.displayName = 'TafsirBottomSheet';

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ref: {
    fontWeight: '700',
    marginBottom: 8,
  },
  arPreview: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  trPreview: {
    marginTop: 8,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 16,
  },
  chips: {
    gap: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  center: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  content: {
    lineHeight: 24,
    marginTop: 8,
  },
  error: {
    color: '#b91c1c',
    marginTop: 8,
  },
});
