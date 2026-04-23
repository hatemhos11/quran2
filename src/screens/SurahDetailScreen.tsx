import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { DrawerActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Appbar, FAB, ProgressBar, Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AyahCard } from '@/components/AyahCard';
import { DownloadButton } from '@/components/DownloadButton';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { SurahHeader } from '@/components/SurahHeader';
import { TafsirBottomSheet } from '@/components/TafsirBottomSheet';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { ar } from '@/i18n/ar';
import type { MainStackParamList } from '@/navigation/types';
import { getArabicFontFamily } from '@/services/fontLoader';
import { loadSurahOffline } from '@/services/offlineStorage';
import { apiFetchSurahWithAyahs } from '@/services/quranApi';
import { pinnedAyahKey, usePinnedAyahStore } from '@/store/pinnedAyahStore';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Ayah, SurahWithAyahs } from '@/types';
import { BISMILLAH } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { isBasmalah, removeBasmalah } from '@/utils/startWithBasmalah';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'SurahDetail'>;

export function SurahDetailScreen({ navigation, route }: Props) {
	useOfflineSync();
	const insets = useSafeAreaInsets();
	const surahNumber = route.params.surahNumber;

	const themeMode = useSettingsStore((s) => s.theme);
	const fontSize = useSettingsStore((s) => s.fontSize);
	const showTransliteration = useSettingsStore((s) => s.showTransliteration);
	const readingFont = useSettingsStore((s) => s.readingFont);
	const isDark = themeMode === 'dark';
	const c = getAppColors(isDark);

	const isOffline = useQuranStore((s) => s.isOffline);
	const downloadedSurahs = useQuranStore((s) => s.downloadedSurahs);
	const setCurrentSurahNumber = useQuranStore((s) => s.setCurrentSurahNumber);
	const downloadSurah = useQuranStore((s) => s.downloadSurah);
	const removeDownload = useQuranStore((s) => s.removeDownload);
	const refreshDownloaded = useQuranStore((s) => s.refreshDownloaded);

	const [data, setData] = useState<SurahWithAyahs | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [scrollProgress, setScrollProgress] = useState(0);
	const [showFab, setShowFab] = useState(false);
	const [dlProgress, setDlProgress] = useState<number | null>(null);
	const [dlBusy, setDlBusy] = useState(false);
	const [selectedNumberInSurah, setSelectedNumberInSurah] = useState<
		number | null
	>(null);

	const scrollRef = useRef<ScrollView>(null);
	const sheetRef = useRef<BottomSheetModal>(null);
	const [picked, setPicked] = useState<Ayah | null>(null);

	const pins = usePinnedAyahStore((s) => s.pins);
	const togglePin = usePinnedAyahStore((s) => s.togglePin);
	const pickedIsPinned = picked
		? !!pins[pinnedAyahKey(surahNumber, picked.numberInSurah)]
		: false;
	const onTogglePickedPin = useCallback(() => {
		if (!picked) return;
		togglePin(surahNumber, picked.numberInSurah);
	}, [picked, surahNumber, togglePin]);

	const arabicFamily = getArabicFontFamily(readingFont);

	useEffect(() => {
		setCurrentSurahNumber(surahNumber);
	}, [surahNumber, setCurrentSurahNumber]);

	useEffect(() => {
		setSelectedNumberInSurah(null);
		setPicked(null);
	}, [surahNumber]);

	useEffect(() => {
		refreshDownloaded();
	}, [refreshDownloaded, surahNumber]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			setData(null);
			try {
				if (isOffline) {
					const local = await loadSurahOffline(surahNumber);
					if (cancelled) return;
					if (!local) {
						setError(ar.surahNotDownloaded);
						setLoading(false);
						return;
					}
					setData(local);
					setLoading(false);
					return;
				}
				const remote = await apiFetchSurahWithAyahs(surahNumber);
				if (!cancelled) {
					setData(remote);
				}
			} catch {
				if (!cancelled) {
					setError(ar.failedLoadSurah);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [surahNumber, isOffline]);

	const isDownloaded = downloadedSurahs.includes(surahNumber);

	const onDownload = useCallback(async () => {
		setDlBusy(true);
		setDlProgress(0);
		try {
			await downloadSurah(surahNumber, setDlProgress, !isOffline);
		} catch (e) {
			setError(e instanceof Error ? e.message : ar.downloadFailed);
		} finally {
			setDlBusy(false);
			setDlProgress(null);
		}
	}, [surahNumber, downloadSurah, isOffline]);

	const onDeleteDl = useCallback(async () => {
		setDlBusy(true);
		try {
			await removeDownload(surahNumber);
		} finally {
			setDlBusy(false);
		}
	}, [surahNumber, removeDownload]);

	const openAyah = useCallback((ayah: Ayah) => {
		setPicked(ayah);
		setSelectedNumberInSurah(ayah.numberInSurah);
		requestAnimationFrame(() => sheetRef.current?.present());
	}, []);

	const onSheetDismiss = useCallback(() => {
		setPicked(null);
		setSelectedNumberInSurah(null);
	}, []);

	const onScroll = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, layoutMeasurement, contentSize } =
				e.nativeEvent;
			const maxScroll = Math.max(
				0,
				contentSize.height - layoutMeasurement.height,
			);
			const y = contentOffset.y;
			setScrollProgress(
				maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0,
			);
			setShowFab(y > 120);
		},
		[],
	);

	const header = useMemo(() => {
		if (!data) return null;
		const showBismillah = surahNumber !== 1 && surahNumber !== 9;
		return (
			<View>
				<SurahHeader
					surah={data}
					isDark={isDark}
					showTransliteration={showTransliteration}
				/>
				<DownloadButton
					isDark={isDark}
					isOnline={!isOffline}
					isDownloaded={isDownloaded}
					progress={dlProgress}
					busy={dlBusy}
					onDownload={onDownload}
					onDelete={onDeleteDl}
				/>
				{showBismillah ? (
					<Text
						style={[
							styles.bismillah,
							{
								color: c.arabic,
								fontSize: fontSize * 0.95,
								fontFamily: arabicFamily,
								lineHeight: fontSize * 1.6,
							},
						]}
					>
						{BISMILLAH}
					</Text>
				) : null}
			</View>
		);
	}, [
		data,
		surahNumber,
		isDark,
		showTransliteration,
		isOffline,
		isDownloaded,
		dlProgress,
		dlBusy,
		fontSize,
		arabicFamily,
		c.arabic,
		onDownload,
		onDeleteDl,
	]);

	if (loading) {
		return (
			<SafeAreaView
				style={[styles.root, { backgroundColor: c.background }]}
				edges={['top']}
			>
				<Appbar.Header
					style={[
						styles.appBarHeader,
						{ backgroundColor: c.surface },
					]}
				>
					<Appbar.Action
						icon='menu'
						onPress={() =>
							navigation.dispatch(DrawerActions.openDrawer())
						}
						accessibilityLabel={ar.openSurahList}
					/>
					<Appbar.Content title=' ' />
					<Appbar.Action
						icon='cog-outline'
						onPress={() => navigation.navigate('Settings')}
						accessibilityLabel={ar.settings}
					/>
				</Appbar.Header>
				<LoadingSkeleton isDark={isDark} />
			</SafeAreaView>
		);
	}

	if (error || !data) {
		return (
			<SafeAreaView
				style={[styles.root, { backgroundColor: c.background }]}
				edges={['top']}
			>
				<Appbar.Header
					style={[
						styles.appBarHeader,
						{ backgroundColor: c.surface },
					]}
				>
					<Appbar.Action
						icon='menu'
						onPress={() =>
							navigation.dispatch(DrawerActions.openDrawer())
						}
					/>
					<Appbar.Content title=' ' />
					<Appbar.Action
						icon='cog-outline'
						onPress={() => navigation.navigate('Settings')}
					/>
				</Appbar.Header>
				<EmptyState
					isDark={isDark}
					title={ar.somethingWrong}
					message={error ?? ar.unknownError}
					onRetry={() =>
						navigation.replace('SurahDetail', { surahNumber })
					}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<Appbar.Header
				style={[styles.appBarHeader, { backgroundColor: c.surface }]}
			>
				<Appbar.Action
					icon='menu'
					onPress={() =>
						navigation.dispatch(DrawerActions.openDrawer())
					}
					accessibilityLabel={ar.openSurahList}
				/>
				<Appbar.Content
					title={data.name}
					subtitle={
						showTransliteration
							? `${ar.surahNumber(data.number)} · ${data.englishName}`
							: ar.surahNumber(data.number)
					}
					titleStyle={{
						color: c.text,
						textAlign: 'center',
						writingDirection: 'rtl',
					}}
					subtitleStyle={{
						color: c.textSecondary,
						textAlign: 'center',
						writingDirection: 'rtl',
					}}
				/>
				<Appbar.Action
					icon='cog-outline'
					onPress={() => navigation.navigate('Settings')}
					accessibilityLabel={ar.settings}
				/>
			</Appbar.Header>

			{isOffline ? (
				<View
					style={[
						styles.banner,
						{ backgroundColor: `${c.accentMuted}33` },
					]}
				>
					<Text
						variant='labelLarge'
						style={{ color: c.text, textAlign: 'center' }}
					>
						{ar.offlineBanner}
					</Text>
				</View>
			) : null}

			<View style={styles.progressTrack}>
				<ProgressBar
					progress={scrollProgress}
					color={c.accent}
					style={styles.progressBar}
				/>
			</View>

			<ScrollView
				ref={scrollRef}
				removeClippedSubviews
				onScroll={onScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator
				contentContainerStyle={{
					paddingBottom: insets.bottom + 72,
					paddingHorizontal: sp.md,
				}}
				style={styles.scroll}
			>
				{header}
				<View style={styles.ayahList}>
					{(() => {
						let ayahs = data.ayahs;

						if (
							ayahs.length &&
							ayahs[0].numberInQuran !== 1 &&
							isBasmalah(ayahs[0].text)
						) {
							ayahs[0].text = removeBasmalah(ayahs[0].text);
						}

						return ayahs.map((ayah) => (
							<AyahCard
								key={`${surahNumber}-${ayah.numberInSurah}`}
								ayah={ayah}
								fontSize={fontSize}
								arabicFontFamily={arabicFamily}
								isDark={isDark}
								selected={
									selectedNumberInSurah === ayah.numberInSurah
								}
								isPinned={
									!!pins[
										pinnedAyahKey(
											surahNumber,
											ayah.numberInSurah,
										)
									]
								}
								onLongPressAyah={openAyah}
							/>
						));
					})()}
				</View>
			</ScrollView>

			{showFab ? (
				<FAB
					icon='arrow-up'
					style={[
						styles.fab,
						{
							bottom: insets.bottom + sp.lg,
							right: sp.lg,
						},
					]}
					onPress={() =>
						scrollRef.current?.scrollTo({ y: 0, animated: true })
					}
					accessibilityLabel={ar.scrollToTop}
				/>
			) : null}

			<TafsirBottomSheet
				ref={sheetRef}
				isDark={isDark}
				isOnline={!isOffline}
				surahNumber={surahNumber}
				surahEnglishName={data.englishName}
				ayah={picked}
				ayahIsPinned={pickedIsPinned}
				onTogglePin={onTogglePickedPin}
				onDismiss={onSheetDismiss}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	appBarHeader: { direction: 'ltr' },
	banner: { paddingHorizontal: sp.lg, paddingVertical: sp.sm },
	progressTrack: { paddingHorizontal: sp.lg, paddingVertical: sp.xs },
	progressBar: { height: 3, borderRadius: 2 },
	scroll: { flex: 1 },
	ayahList: {
		marginTop: sp.sm,
	},
	bismillah: {
		textAlign: 'center',
		marginVertical: sp.lg,
		paddingHorizontal: sp.lg,
		writingDirection: 'rtl',
	},
	fab: { position: 'absolute' },
});

