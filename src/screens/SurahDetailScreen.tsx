import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, FAB, Text } from 'react-native-paper';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AyahAudioPlayer } from '@/components/AyahAudioPlayer';
import { AyahCard } from '@/components/AyahCard';
import { ContinuousAyahBlock } from '@/components/ContinuousAyahBlock';
import { SurahHeader } from '@/components/SurahHeader';
import { TafsirBottomSheet } from '@/components/TafsirBottomSheet';
import { useAyahAudio } from '@/hooks/useAyahAudio';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { ar } from '@/i18n/ar';
import type { SurahsStackParamList } from '@/navigation/types';
import { getQuranFontFamily } from '@/services/fontLoader';
import { loadSurahOffline } from '@/services/offlineStorage';
import { pinnedAyahKey, usePinnedAyahStore } from '@/store/pinnedAyahStore';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Ayah, SurahWithAyahs } from '@/types';
import { BISMILLAH } from '@/utils/constants';
import { formatAyahDisplayText } from '@/utils/ayahText';
import { sp } from '@/utils/spacing';
import { isBasmalah, removeBasmalah } from '@/utils/startWithBasmalah';
import { getAppColors } from '@/utils/theme';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

export function SurahDetailScreen({ navigation, route }: Props) {
	useOfflineSync();
	const insets = useSafeAreaInsets();
	const surahNumber = route.params.surahNumber;

	const themeMode = useSettingsStore((s) => s.theme);
	const fontSize = useSettingsStore((s) => s.fontSize);
	const showTransliteration = useSettingsStore((s) => s.showTransliteration);
	const preferredReciter = useSettingsStore((s) => s.preferredReciter);
	const ayahLayout = useSettingsStore((s) => s.ayahLayout);
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
		return ayahs.map((a) => ({
			...a,
			text: formatAyahDisplayText(a.text),
		}));
	}, [data]);

	const arabicFamily = getQuranFontFamily();

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
		[playAyah],
	);

	const pinnedNumbers = useMemo(() => {
		const set = new Set<number>();
		for (const ayah of preparedAyahs) {
			if (pins[pinnedAyahKey(surahNumber, ayah.numberInSurah)]) {
				set.add(ayah.numberInSurah);
			}
		}
		return set;
	}, [preparedAyahs, pins, surahNumber]);

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

	const onScroll = useCallback((e: any) => {
		const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
		const maxScroll = Math.max(
			0,
			contentSize.height - layoutMeasurement.height,
		);
		const y = contentOffset.y;
		setScrollProgress(
			maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0,
		);
		setShowFab(y > 120);
	}, []);
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
					<View
						style={[
							styles.bismillahFrame,
							{
								backgroundColor: c.surface,
								borderColor: c.border,
							},
						]}
					>
						<Text
							style={[
								styles.bismillah,
								{
									color: c.arabic,
									fontSize: fontSize * 0.95,
									fontFamily: arabicFamily,
									lineHeight: fontSize * 1.85,
								},
							]}
						>
							{BISMILLAH}
						</Text>
					</View>
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
		c,
	]);

	// ... loading / error branches: swap the appbar style below ...

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<Appbar.Header
				style={[
					styles.appBarHeader,
					{
						backgroundColor: c.background,
						borderBottomColor: c.border,
					},
				]}
				statusBarHeight={0}
			>
				<Appbar.BackAction
					onPress={() => navigation.goBack()}
					accessibilityLabel={ar.surahs}
					color={c.text}
				/>
				<Appbar.Content
					title={data?.name ?? ''}
					titleStyle={{
						color: c.text,
						fontSize: 17,
						fontWeight: '600',
						textAlign: 'center',
						writingDirection: 'rtl',
						fontFamily: arabicFamily,
					}}
				/>
				<View style={{ width: 48 }} />
			</Appbar.Header>

			{/* Hairline progress bar */}
			<View style={[styles.progressTrack, { backgroundColor: c.border }]}>
				<View
					style={[
						styles.progressFill,
						{
							backgroundColor: c.accent,
							width: `${scrollProgress * 100}%`,
						},
					]}
				/>
			</View>

			<ScrollView
				ref={scrollRef}
				removeClippedSubviews
				onScroll={onScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: insets.bottom + playerBottomInset + 72,
					paddingHorizontal: sp.md,
				}}
				style={styles.scroll}
			>
				{header}
				<View style={styles.ayahList}>
					{ayahLayout === 'continuous' ? (
						<ContinuousAyahBlock
							ayahs={preparedAyahs}
							fontSize={fontSize}
							arabicFontFamily={arabicFamily}
							isDark={isDark}
							selectedNumberInSurah={selectedNumberInSurah}
							pinnedNumbers={pinnedNumbers}
							isActive={isActive}
							isTrackPlaying={isTrackPlaying}
							isTrackLoading={isTrackLoading}
							onPressAyah={onPressPlayAyah}
							onLongPressAyah={openAyah}
						/>
					) : (
						preparedAyahs.map((ayah) => (
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
								isLoadingAudio={isTrackLoading(
									ayah.numberInQuran,
								)}
								onPressPlay={onPressPlayAyah}
								onLongPressAyah={openAyah}
							/>
						))
					)}
				</View>
			</ScrollView>

			{/* Floating audio player with elevated dock look */}
			{playerVisible && currentTrack ? (
				<View
					style={[
						styles.playerWrap,
						{
							paddingBottom: insets.bottom,
							backgroundColor: c.surfaceElevated,
							borderTopColor: c.border,
							shadowColor: c.cardShadow,
						},
					]}
				>
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
					color={c.surface}
					style={[
						styles.fab,
						{
							backgroundColor: c.accent,
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
				surahEnglishName={data?.englishName ?? ''}
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
	appBarHeader: {
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	banner: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'center',
		gap: sp.sm,
		paddingHorizontal: sp.lg,
		paddingVertical: sp.sm,
	},
	bannerDot: { width: 6, height: 6, borderRadius: 3 },
	progressTrack: {
		height: 2,
		width: '100%',
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderTopRightRadius: 2,
		borderBottomRightRadius: 2,
	},
	scroll: { flex: 1 },
	ayahList: { marginTop: sp.sm },
	bismillahFrame: {
		marginHorizontal: sp.sm,
		marginVertical: sp.lg,
		paddingHorizontal: sp.lg,
		paddingVertical: sp.md,
		borderRadius: 16,
		borderWidth: 1,
	},
	bismillah: {
		textAlign: 'center',
		writingDirection: 'rtl',
	},
	fab: {
		position: 'absolute',
		borderRadius: 16,
	},
	playerWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		borderTopWidth: StyleSheet.hairlineWidth,
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 1,
		shadowRadius: 12,
		elevation: 8,
	},
});

