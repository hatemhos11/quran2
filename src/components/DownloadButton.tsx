import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text, useTheme } from 'react-native-paper';
import { downloadSurahForOffline } from '../services/downloadSurah';
import { deleteSurahDownload, isSurahDownloaded } from '../services/offlineStorage';
import { useSettingsStore } from '../store/settingsStore';
import { useQuranStore } from '../store/quranStore';
import type { SurahSummary } from '../types';

type Props = {
  meta: SurahSummary;
};

export function DownloadButton({ meta }: Props) {
  const theme = useTheme();
  const arabicEdition = useSettingsStore((s) => s.arabicEdition);
  const translationEdition = useSettingsStore((s) => s.translationEdition);
  const preferredTafsir = useSettingsStore((s) => s.preferredTafsir);
  const refreshDownloaded = useQuranStore((s) => s.refreshDownloaded);
  const refreshStorageEstimate = useQuranStore((s) => s.refreshStorageEstimate);

  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const refresh = useCallback(async () => {
    const d = await isSurahDownloaded(meta.number);
    setDownloaded(d);
  }, [meta.number]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onDownload = useCallback(async () => {
    setBusy(true);
    setProgress(0);
    try {
      await downloadSurahForOffline(
        meta,
        arabicEdition,
        translationEdition,
        [preferredTafsir],
        (pct) => setProgress(pct / 100)
      );
      await refresh();
      await refreshDownloaded();
      await refreshStorageEstimate();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, [
    arabicEdition,
    meta,
    preferredTafsir,
    refresh,
    refreshDownloaded,
    refreshStorageEstimate,
    translationEdition,
  ]);

  const onDelete = useCallback(async () => {
    setBusy(true);
    try {
      await deleteSurahDownload(meta.number);
      await refresh();
      await refreshDownloaded();
      await refreshStorageEstimate();
    } finally {
      setBusy(false);
    }
  }, [meta.number, refresh, refreshDownloaded, refreshStorageEstimate]);

  return (
    <View style={styles.wrap}>
      {busy ? (
        <>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Downloading…
          </Text>
          <ProgressBar progress={progress} style={styles.bar} />
        </>
      ) : downloaded ? (
        <Button mode="outlined" icon="delete" onPress={onDelete} disabled={busy}>
          Remove download
        </Button>
      ) : (
        <Button mode="contained" icon="download" onPress={onDownload} disabled={busy}>
          Download surah
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
});
