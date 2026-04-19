import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, List, ProgressBar, Switch, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ar } from '@/i18n/ar';
import type { MainStackParamList } from '@/navigation/types';
import { clearAllOfflineData, getApproxStorageBytes } from '@/services/offlineStorage';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ReadingFontId, ThemeMode, TafsirEdition } from '@/types';
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  SURAH_COUNT,
  TAFSIR_SOURCES,
} from '@/utils/constants';
import {
  estimateFullOfflinePackageBytes,
  estimateFullTextOnlyPackageBytes,
  estimateRemainingBulkDownloadBytes,
} from '@/utils/offlinePackageEstimate';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

function formatBytes(n: number) {
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(2)} م.ب`;
}

export function SettingsScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const c = getAppColors(isDark);

  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const preferredTafsir = useSettingsStore((s) => s.preferredTafsir);
  const setPreferredTafsir = useSettingsStore((s) => s.setPreferredTafsir);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration);
  const readingFont = useSettingsStore((s) => s.readingFont);
  const setReadingFont = useSettingsStore((s) => s.setReadingFont);

  const refreshDownloaded = useQuranStore((s) => s.refreshDownloaded);
  const isOffline = useQuranStore((s) => s.isOffline);
  const downloadAllSurahs = useQuranStore((s) => s.downloadAllSurahs);
  const surahs = useQuranStore((s) => s.surahs);
  const downloadedSurahs = useQuranStore((s) => s.downloadedSurahs);

  const [storageBytes, setStorageBytes] = useState(0);
  const [allDlBusy, setAllDlBusy] = useState(false);
  const [allDlProgress, setAllDlProgress] = useState(0);
  const [bulkDlKind, setBulkDlKind] = useState<'full' | 'simple' | null>(null);
  const bulkAbortRef = useRef<AbortController | null>(null);

  const refreshStorage = useCallback(async () => {
    const n = await getApproxStorageBytes();
    setStorageBytes(n);
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [refreshStorage]);

  useFocusEffect(
    useCallback(() => {
      void refreshDownloaded();
    }, [refreshDownloaded])
  );

  const fullPackageBytes = useMemo(() => estimateFullOfflinePackageBytes(), []);
  const simplePackageBytes = useMemo(() => estimateFullTextOnlyPackageBytes(), []);
  const remainingFullBytes = useMemo(
    () => estimateRemainingBulkDownloadBytes(surahs, downloadedSurahs, true),
    [surahs, downloadedSurahs]
  );
  const remainingSimpleBytes = useMemo(
    () => estimateRemainingBulkDownloadBytes(surahs, downloadedSurahs, false),
    [surahs, downloadedSurahs]
  );
  const downloadSizeDescription = useMemo(() => {
    const remFull =
      remainingFullBytes > 0 ? formatBytes(remainingFullBytes) : null;
    const remSimple =
      remainingSimpleBytes > 0 ? formatBytes(remainingSimpleBytes) : null;
    return [
      ar.approxDownloadPackageFull(formatBytes(fullPackageBytes), remFull),
      ar.approxDownloadPackageSimple(formatBytes(simplePackageBytes), remSimple),
      '',
      ar.approxDownloadPackageNote,
    ].join('\n');
  }, [
    fullPackageBytes,
    simplePackageBytes,
    remainingFullBytes,
    remainingSimpleBytes,
  ]);

  const onClearAll = () => {
    Alert.alert(ar.removeAllTitle, ar.removeAllMessage, [
      { text: ar.cancel, style: 'cancel' },
      {
        text: ar.delete,
        style: 'destructive',
        onPress: async () => {
          await clearAllOfflineData();
          await refreshDownloaded();
          await refreshStorage();
        },
      },
    ]);
  };

  const startBulkDownload = useCallback(
    (includeTafsir: boolean) => {
      if (isOffline) {
        Alert.alert(ar.somethingWrong, ar.offlineConnectToDownload);
        return;
      }
      const confirmTitle = includeTafsir
        ? ar.downloadFullPackageConfirmTitle
        : ar.downloadSimplePackageConfirmTitle;
      const confirmMessage = includeTafsir
        ? ar.downloadFullPackageConfirmMessage
        : ar.downloadSimplePackageConfirmMessage;
      Alert.alert(confirmTitle, confirmMessage, [
        { text: ar.cancel, style: 'cancel' },
        {
          text: ar.startBulkDownload,
          onPress: async () => {
            await refreshDownloaded();
            if (useQuranStore.getState().downloadedSurahs.length >= SURAH_COUNT) {
              Alert.alert(
                includeTafsir ? ar.downloadFullPackage : ar.downloadSimplePackage,
                ar.downloadAllUpToDate
              );
              return;
            }
            setBulkDlKind(includeTafsir ? 'full' : 'simple');
            setAllDlBusy(true);
            setAllDlProgress(0);
            bulkAbortRef.current = new AbortController();
            const signal = bulkAbortRef.current.signal;
            try {
              const { failedSurahs, cancelled } = await downloadAllSurahs(
                setAllDlProgress,
                !useQuranStore.getState().isOffline,
                { signal, includeTafsir }
              );
              await refreshStorage();
              if (!cancelled && failedSurahs.length > 0) {
                Alert.alert(ar.somethingWrong, ar.downloadAllSomeFailed(failedSurahs.length));
              }
            } catch (e) {
              Alert.alert(
                ar.somethingWrong,
                e instanceof Error ? e.message : ar.unknownError
              );
            } finally {
              bulkAbortRef.current = null;
              setBulkDlKind(null);
              setAllDlBusy(false);
              setAllDlProgress(0);
            }
          },
        },
      ]);
    },
    [isOffline, downloadAllSurahs, refreshDownloaded, refreshStorage]
  );

  const previewArabic = 'قُلْ هُوَ اللَّهُ أَحَدٌ';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + sp.xxl }}>
      <List.Section>
        <List.Subheader style={{ color: c.textSecondary }}>{ar.reading}</List.Subheader>
        <View style={styles.pad}>
          <Text variant="titleSmall" style={{ color: c.text }}>
            {ar.arabicSize(fontSize)}
          </Text>
          <Slider
            minimumValue={FONT_SIZE_MIN}
            maximumValue={FONT_SIZE_MAX}
            step={1}
            value={fontSize}
            onValueChange={setFontSize}
            minimumTrackTintColor={c.accent}
            maximumTrackTintColor={c.textSecondary}
            thumbTintColor={c.accent}
            accessibilityLabel={ar.arabicSize(fontSize)}
          />
          <Text
            style={{
              fontSize,
              lineHeight: fontSize * 2.2,
              color: c.arabic,
              textAlign: 'center',
              marginTop: sp.sm,
              fontFamily:
                readingFont === 'amiri'
                  ? 'Amiri_400Regular'
                  : readingFont === 'scheherazade'
                    ? 'ScheherazadeNew_400Regular'
                    : undefined,
            }}>
            {previewArabic}
          </Text>
        </View>
        <Divider />
        <List.Item
          title={ar.transliterationTitle}
          description={ar.transliterationDesc}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
          right={() => (
            <Switch
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              accessibilityLabel={ar.transliterationTitle}
            />
          )}
        />
        <Divider />
        <List.Subheader style={{ color: c.textSecondary }}>{ar.arabicFont}</List.Subheader>
        {(['amiri', 'scheherazade', 'system'] as ReadingFontId[]).map((id) => (
          <List.Item
            key={id}
            title={
              id === 'amiri' ? ar.fontAmiri : id === 'scheherazade' ? ar.fontScheherazade : ar.fontSystem
            }
            titleStyle={{ color: c.text }}
            onPress={() => setReadingFont(id)}
            right={() =>
              readingFont === id ? <List.Icon icon="check" color={c.accent} /> : null
            }
          />
        ))}
      </List.Section>

      <List.Section>
        <List.Subheader style={{ color: c.textSecondary }}>{ar.appearance}</List.Subheader>
        {(['light', 'dark'] as ThemeMode[]).map((m) => (
          <List.Item
            key={m}
            title={m === 'light' ? ar.light : ar.dark}
            titleStyle={{ color: c.text }}
            onPress={() => setTheme(m)}
            right={() => (theme === m ? <List.Icon icon="check" color={c.accent} /> : null)}
          />
        ))}
      </List.Section>

      <List.Section>
        <List.Subheader style={{ color: c.textSecondary }}>{ar.preferredTafsir}</List.Subheader>
        {TAFSIR_SOURCES.map((s) => (
          <List.Item
            key={s.id}
            title={s.label}
            titleStyle={{ color: c.text }}
            onPress={() => setPreferredTafsir(s.id as TafsirEdition)}
            right={() =>
              preferredTafsir === s.id ? <List.Icon icon="check" color={c.accent} /> : null
            }
          />
        ))}
      </List.Section>

      <List.Section>
        <List.Subheader style={{ color: c.textSecondary }}>{ar.offlineStorage}</List.Subheader>
        <List.Item
          title={ar.estimatedData}
          description={formatBytes(storageBytes)}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
        />
        <Button mode="outlined" onPress={refreshStorage} style={styles.btn} textColor={c.text}>
          {ar.refreshEstimate}
        </Button>
        <List.Item
          title={ar.approxDownloadPackageTitle}
          description={downloadSizeDescription}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
        />
        <List.Item
          title={ar.downloadFullPackage}
          description={ar.downloadFullPackageDesc}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
        />
        <List.Item
          title={ar.downloadSimplePackage}
          description={ar.downloadSimplePackageDesc}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
        />
        {allDlBusy ? (
          <View style={styles.progressWrap}>
            <Text variant="labelLarge" style={[styles.progressKind, { color: c.text }]}>
              {bulkDlKind === 'simple' ? ar.downloadSimplePackage : ar.downloadFullPackage}
            </Text>
            <ProgressBar progress={allDlProgress / 100} color={c.accent} style={styles.progressBar} />
            <Text variant="labelMedium" style={[styles.progressLabel, { color: c.textSecondary }]}>
              {ar.downloadingPct(allDlProgress)}
            </Text>
            <Button
              mode="outlined"
              onPress={() => bulkAbortRef.current?.abort()}
              style={styles.stopBtn}
              textColor="#b71c1c"
              accessibilityLabel={ar.stopDownload}>
              {ar.stopDownload}
            </Button>
          </View>
        ) : null}
        <Button
          mode="contained"
          onPress={() => startBulkDownload(true)}
          disabled={allDlBusy || isOffline}
          style={styles.btn}
          buttonColor={c.accent}
          textColor='#fff'>
          {ar.downloadFullPackage}
        </Button>
        <Button
          mode="outlined"
          onPress={() => startBulkDownload(false)}
          disabled={allDlBusy || isOffline}
          style={styles.btn}
          textColor={c.accent}>
          {ar.downloadSimplePackage}
        </Button>
        <Button mode="contained-tonal" onPress={onClearAll} style={styles.btn} textColor="#b71c1c">
          {ar.clearAllDownloads}
        </Button>
      </List.Section>

      <List.Section>
        <List.Subheader style={{ color: c.textSecondary }}>{ar.about}</List.Subheader>
        <List.Item
          title={ar.appName}
          description={ar.aboutDesc(dayjs().format('YYYY'))}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
        />
        <List.Item
          title={ar.api}
          description={ar.apiHost}
          titleStyle={{ color: c.text }}
          descriptionStyle={{ color: c.textSecondary }}
          onPress={() => Linking.openURL('https://alquran.cloud/api')}
        />
        {Constants.expoConfig?.version ? (
          <List.Item
            title={ar.version}
            description={Constants.expoConfig.version}
            titleStyle={{ color: c.text }}
            descriptionStyle={{ color: c.textSecondary }}
          />
        ) : null}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: sp.lg, paddingVertical: sp.sm },
  btn: { marginHorizontal: sp.lg, marginVertical: sp.xs },
  progressWrap: { marginHorizontal: sp.lg, marginBottom: sp.sm },
  progressKind: { textAlign: 'center', marginBottom: sp.sm },
  progressBar: { height: 4, borderRadius: 2 },
  progressLabel: { marginTop: sp.xs, textAlign: 'center' },
  stopBtn: { marginTop: sp.md },
});
