import type { BottomSheetModal } from '@gorhom/bottom-sheet';
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

import { AyahAudioPlayer } from '@/components/AyahAudioPlayer';
import { AyahCard } from '@/components/AyahCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { SurahHeader } from '@/components/SurahHeader';
import { TafsirBottomSheet } from '@/components/TafsirBottomSheet';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAyahAudio } from '@/hooks/useAyahAudio';
import { ar } from '@/i18n/ar';
import type { SurahsStackParamList } from '@/navigation/types';
import { getArabicFontFamily } from '@/services/fontLoader';
import { loadSurahOffline } from '@/services/offlineStorage';
import { pinnedAyahKey, usePinnedAyahStore } from '@/store/pinnedAyahStore';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Ayah, SurahWithAyahs } from '@/types';
import { BISMILLAH } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { isBasmalah, removeBasmalah } from '@/utils/startWithBasmalah';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

export function SurahDetailScreen({ navigation, route }: Props) {
	useOfflineSync();
	const insets = useSafeAreaInsets();
	const surahNumber = route.params.surahNumber;

	const themeMode = useSettingsStore((s) => s.theme);
	const fontSize = useSettingsStore((s) => s.fontSize);
	const showTransliteration = useSettingsStore((s) => s.showTransliteration);
	const readingFont = useSettingsStore((s) => s.readingFont);
	const preferredReciter = useSettingsStore((s) => s.preferredReciter);
	const isDark = themeMode === 'dark';
	const c = getAppColors(isDark);

	const isOffline = useQuranStore((s) => s.isOffline);
	const setCurrentSurahNumber = useQuranStore((s) => s.setCurrentSurahNumber);

	const [data, setData] = useState<SurahWithAyahs | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [scrollProgress, setScrollProgress] = useState(0);
	const [showFab, setShowFab] = useState(false);
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

	const preparedAyahs = useMemo(() => {
		if (!data) return [];
		const ayahs = data.ayahs.map((a) => ({ ...a }));
		if (
			ayahs.length &&
			ayahs[0].numberInQuran !== 1 &&
			isBasmalah(ayahs[0].text)
		) {
			ayahs[0] = { ...ayahs[0], text: removeBasmalah(ayahs[0].text) };
		}
		return ayahs;
	}, [data]);

	const arabicFamily = getArabicFontFamily(readingFont);

	const {
		currentTrack,
		isPlaying: audioIsPlaying,
		isLoading: audioIsLoading,
		positionMillis,
		durationMillis,
		repeatEnabled,
		autoNextEnabled,
		playAyah,
		togglePlayPause,
		stop,
		seek,
		toggleRepeat,
		toggleAutoNext,
		isActive,
		isTrackPlaying,
		isTrackLoading,
		playerVisible,
	} = useAyahAudio(preferredReciter, preparedAyahs);

	const onPressPlayAyah = useCallback(
		(ayah: Ayah) => {
			playAyah(ayah);
		},
		[playAyah]
	);

	const playerBottomInset = playerVisible ? 118 : 0;

	useEffect(() => {
		setCurrentSurahNumber(surahNumber);
	}, [surahNumber, setCurrentSurahNumber]);

	useEffect(() => {
		setSelectedNumberInSurah(null);
		setPicked(null);
		void stop();
	}, [surahNumber, stop]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			setData(null);
			try {
				const local = await loadSurahOffline(surahNumber);
				if (cancelled) return;
				if (!local) {
					setError(ar.failedLoadSurah);
					setLoading(false);
					return;
				}
				setData(local);
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
	}, [surahNumber]);

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
		fontSize,
		arabicFamily,
		c.arabic,
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
					<Appbar.BackAction
						onPress={() => navigation.goBack()}
						accessibilityLabel={ar.surahs}
					/>
					<Appbar.Content title=' ' />
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
					<Appbar.BackAction onPress={() => navigation.goBack()} />
					<Appbar.Content title=' ' />
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
				<Appbar.BackAction
					onPress={() => navigation.goBack()}
					accessibilityLabel={ar.surahs}
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
					paddingBottom: insets.bottom + playerBottomInset + 72,
					paddingHorizontal: sp.md,
				}}
				style={styles.scroll}
			>
				{header}
				<View style={styles.ayahList}>
					{preparedAyahs.map((ayah) => (
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
							isActive={isActive(ayah.numberInQuran)}
							isPlaying={isTrackPlaying(ayah.numberInQuran)}
							isLoadingAudio={isTrackLoading(ayah.numberInQuran)}
							onPressPlay={onPressPlayAyah}
							onLongPressAyah={openAyah}
						/>
					))}
				</View>
			</ScrollView>

			{playerVisible && currentTrack ? (
				<View style={[styles.playerWrap, { paddingBottom: insets.bottom }]}>
					<AyahAudioPlayer
						isDark={isDark}
						ayahNumber={currentTrack.numberInSurah}
						isPlaying={audioIsPlaying}
						isLoading={audioIsLoading}
						positionMillis={positionMillis}
						durationMillis={durationMillis}
						repeatEnabled={repeatEnabled}
						autoNextEnabled={autoNextEnabled}
						onTogglePlayPause={() => void togglePlayPause()}
						onSeek={(pos) => void seek(pos)}
						onToggleRepeat={toggleRepeat}
						onToggleAutoNext={toggleAutoNext}
						onClose={() => void stop()}
					/>
				</View>
			) : null}

			{showFab ? (
				<FAB
					icon='arrow-up'
					style={[
						styles.fab,
						{
							bottom: insets.bottom + playerBottomInset + sp.lg,
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
	playerWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
	},
});

