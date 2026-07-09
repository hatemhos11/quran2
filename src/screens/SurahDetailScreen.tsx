import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	View,
	type ListRenderItem,
} from 'react-native';
import { Appbar, FAB, Text } from 'react-native-paper';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AyahAudioPlayer } from '@/components/AyahAudioPlayer';
import { AyahCard } from '@/components/AyahCard';
import { MushafPageBlock } from '@/components/ContinuousAyahBlock';
import { SurahHeader } from '@/components/SurahHeader';
import { TafsirBottomSheet } from '@/components/TafsirBottomSheet';
import { useAyahAudio } from '@/hooks/useAyahAudio';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSurahContent, type AyahPage, type MushafPage } from '@/hooks/useSurahContent';
import { ar } from '@/i18n/ar';
import type { SurahsStackParamList } from '@/navigation/types';
import { getQuranFontFamily } from '@/services/fontLoader';
import { pinnedAyahKey, usePinnedAyahStore } from '@/store/pinnedAyahStore';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Ayah } from '@/types';
import {
	AYAH_PAGE_ESTIMATE_HEIGHT,
	BISMILLAH,
	MUSHAF_PAGE_ESTIMATE_HEIGHT,
} from '@/utils/constants';
import { sp } from '@/utils/spacing';
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

	const {
		meta,
		ayahIndex,
		ayahPages,
		mushafPages,
		loading,
		loadingMore,
		hasMore,
		error,
		loadMore,
	} = useSurahContent(surahNumber, ayahLayout);

	const [scrollProgress, setScrollProgress] = useState(0);
	const [showFab, setShowFab] = useState(false);
	const [selectedNumberInSurah, setSelectedNumberInSurah] = useState<
		number | null
	>(null);

	const listRef = useRef<FlatList<any>>(null);
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

	const arabicFamily = getQuranFontFamily();

	const audioTracks = useMemo(
		() =>
			ayahIndex.map((a) => ({
				numberInSurah: a.numberInSurah,
				numberInQuran: a.numberInQuran,
			})),
		[ayahIndex],
	);

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
	} = useAyahAudio(preferredReciter, audioTracks);

	const onPressPlayAyah = useCallback(
		(ayah: Ayah) => {
			playAyah(ayah);
		},
		[playAyah],
	);

	const pinnedNumbers = useMemo(() => {
		const set = new Set<number>();
		for (const ayah of ayahIndex) {
			if (pins[pinnedAyahKey(surahNumber, ayah.numberInSurah)]) {
				set.add(ayah.numberInSurah);
			}
		}
		return set;
	}, [ayahIndex, pins, surahNumber]);

	const playerBottomInset = playerVisible ? 118 : 0;

	useEffect(() => {
		setCurrentSurahNumber(surahNumber);
	}, [surahNumber, setCurrentSurahNumber]);

	useEffect(() => {
		setSelectedNumberInSurah(null);
		setPicked(null);
		void stop();
	}, [surahNumber, stop]);

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

	const listHeader = useMemo(() => {
		if (!meta) return null;
		const showBismillah = surahNumber !== 1 && surahNumber !== 9;
		return (
			<View>
				<SurahHeader
					surah={meta}
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
		meta,
		surahNumber,
		isDark,
		showTransliteration,
		fontSize,
		arabicFamily,
		c,
	]);

	const listFooter = useMemo(
		() =>
			loadingMore ? (
				<View style={styles.footerLoader}>
					<ActivityIndicator color={c.accent} />
				</View>
			) : (
				<View style={styles.footerSpacer} />
			),
		[c.accent, loadingMore],
	);

	const sharedAyahProps = useMemo(
		() => ({
			fontSize,
			arabicFontFamily: arabicFamily,
			isDark,
			selectedNumberInSurah,
			pinnedNumbers,
			isActive,
			isTrackPlaying,
			isTrackLoading,
			onPressAyah: onPressPlayAyah,
			onLongPressAyah: openAyah,
		}),
		[
			fontSize,
			arabicFamily,
			isDark,
			selectedNumberInSurah,
			pinnedNumbers,
			isActive,
			isTrackPlaying,
			isTrackLoading,
			onPressPlayAyah,
			openAyah,
		],
	);

	const renderAyahPage: ListRenderItem<AyahPage> = useCallback(
		({ item }) => (
			<View>
				{item.ayahs.map((ayah) => (
					<AyahCard
						key={`${surahNumber}-${ayah.numberInSurah}`}
						ayah={ayah}
						fontSize={fontSize}
						arabicFontFamily={arabicFamily}
						isDark={isDark}
						selected={selectedNumberInSurah === ayah.numberInSurah}
						isPinned={
							!!pins[pinnedAyahKey(surahNumber, ayah.numberInSurah)]
						}
						isActive={isActive(ayah.numberInQuran)}
						isPlaying={isTrackPlaying(ayah.numberInQuran)}
						isLoadingAudio={isTrackLoading(ayah.numberInQuran)}
						onPressPlay={onPressPlayAyah}
						onLongPressAyah={openAyah}
					/>
				))}
			</View>
		),
		[
			fontSize,
			arabicFamily,
			isDark,
			selectedNumberInSurah,
			pins,
			surahNumber,
			isActive,
			isTrackPlaying,
			isTrackLoading,
			onPressPlayAyah,
			openAyah,
		],
	);

	const renderMushafPage: ListRenderItem<MushafPage> = useCallback(
		({ item }) => (
			<MushafPageBlock
				page={item.page}
				pageAyahs={item.ayahs}
				{...sharedAyahProps}
			/>
		),
		[sharedAyahProps],
	);

	const keyExtractorAyahPage = useCallback((page: AyahPage) => page.key, []);

	const keyExtractorMushafPage = useCallback(
		(item: MushafPage) => `page-${item.page}`,
		[],
	);

	const getAyahPageItemLayout = useCallback(
		(_: ArrayLike<AyahPage> | null | undefined, index: number) => ({
			length: AYAH_PAGE_ESTIMATE_HEIGHT,
			offset: AYAH_PAGE_ESTIMATE_HEIGHT * index,
			index,
		}),
		[],
	);

	const getPageItemLayout = useCallback(
		(_: ArrayLike<MushafPage> | null | undefined, index: number) => ({
			length: MUSHAF_PAGE_ESTIMATE_HEIGHT,
			offset: MUSHAF_PAGE_ESTIMATE_HEIGHT * index,
			index,
		}),
		[],
	);

	const listEmpty = useMemo(() => {
		if (loading) {
			return (
				<View style={styles.centerState}>
					<ActivityIndicator color={c.accent} />
					<Text style={{ color: c.textSecondary, marginTop: sp.md }}>
						{ar.loading}
					</Text>
				</View>
			);
		}
		if (error) {
			return (
				<View style={styles.centerState}>
					<Text style={{ color: c.text }}>{ar.failedLoadSurah}</Text>
				</View>
			);
		}
		return null;
	}, [c.accent, c.text, c.textSecondary, error, loading]);

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
					title={meta?.name ?? ''}
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

			{isOffline ? (
				<View
					style={[
						styles.banner,
						{ backgroundColor: c.accentMutedSoft },
					]}
				>
					<View
						style={[
							styles.bannerDot,
							{ backgroundColor: c.accentMuted },
						]}
					/>
					<Text
						style={{
							color: c.text,
							fontSize: 12,
							fontWeight: '600',
						}}
					>
						{ar.offlineBanner}
					</Text>
				</View>
			) : null}

			{ayahLayout === 'continuous' ? (
				<FlatList
					ref={listRef}
					data={mushafPages}
					keyExtractor={keyExtractorMushafPage}
					renderItem={renderMushafPage}
					ListHeaderComponent={listHeader}
					ListFooterComponent={listFooter}
					ListEmptyComponent={listEmpty}
					onScroll={onScroll}
					scrollEventThrottle={16}
					onEndReached={loadMore}
					onEndReachedThreshold={0.4}
					removeClippedSubviews
					initialNumToRender={2}
					maxToRenderPerBatch={2}
					windowSize={5}
					getItemLayout={getPageItemLayout}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={[
						styles.listContent,
						{
							paddingBottom: insets.bottom + playerBottomInset + 72,
						},
					]}
					style={styles.scroll}
				/>
			) : (
				<FlatList
					ref={listRef}
					data={ayahPages}
					keyExtractor={keyExtractorAyahPage}
					renderItem={renderAyahPage}
					ListHeaderComponent={listHeader}
					ListFooterComponent={listFooter}
					ListEmptyComponent={listEmpty}
					onScroll={onScroll}
					scrollEventThrottle={16}
					onEndReached={loadMore}
					onEndReachedThreshold={0.35}
					removeClippedSubviews
					initialNumToRender={2}
					maxToRenderPerBatch={2}
					windowSize={5}
					getItemLayout={getAyahPageItemLayout}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={[
						styles.listContent,
						{
							paddingBottom: insets.bottom + playerBottomInset + 72,
						},
					]}
					style={styles.scroll}
				/>
			)}

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
						listRef.current?.scrollToOffset({
							offset: 0,
							animated: true,
						})
					}
					accessibilityLabel={ar.scrollToTop}
				/>
			) : null}

			<TafsirBottomSheet
				ref={sheetRef}
				isDark={isDark}
				surahNumber={surahNumber}
				surahEnglishName={meta?.englishName ?? ''}
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
	listContent: {
		paddingHorizontal: sp.md,
	},
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
	footerLoader: {
		paddingVertical: sp.lg,
		alignItems: 'center',
	},
	footerSpacer: {
		height: sp.sm,
	},
	centerState: {
		paddingVertical: sp.xxl,
		alignItems: 'center',
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
