import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AyahEndMarkerText } from '@/components/AyahEndMarker';
import { ar } from '@/i18n/ar';
import type { Ayah } from '@/types';
import { convertToArabicNumerals } from '@/utils/arabicNumerals';
import { groupAyahsByPage } from '@/utils/groupAyahsByPage';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
	ayahs: Ayah[];
	fontSize: number;
	arabicFontFamily?: string;
	isDark: boolean;
	selectedNumberInSurah: number | null;
	pinnedNumbers: Set<number>;
	isActive: (numberInQuran: number) => boolean;
	isTrackPlaying: (numberInQuran: number) => boolean;
	isTrackLoading: (numberInQuran: number) => boolean;
	onPressAyah: (ayah: Ayah) => void;
	onLongPressAyah: (ayah: Ayah) => void;
};

type PageBlockProps = Pick<
	Props,
	| 'fontSize'
	| 'arabicFontFamily'
	| 'isDark'
	| 'selectedNumberInSurah'
	| 'pinnedNumbers'
	| 'isActive'
	| 'isTrackPlaying'
	| 'isTrackLoading'
	| 'onPressAyah'
	| 'onLongPressAyah'
> & {
	page: number;
	pageAyahs: Ayah[];
};

export const MushafPageBlock = memo(function MushafPageBlock({
	page,
	pageAyahs,
	fontSize,
	arabicFontFamily,
	isDark,
	selectedNumberInSurah,
	pinnedNumbers,
	isActive,
	isTrackPlaying,
	isTrackLoading,
	onPressAyah,
	onLongPressAyah,
}: PageBlockProps) {
	const c = getAppColors(isDark);
	const lineHeight = fontSize * 2.1;

	const handlePress = useCallback(
		(ayah: Ayah) => {
			if (Platform.OS !== 'web') {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
					() => undefined,
				);
			}
			onPressAyah(ayah);
		},
		[onPressAyah],
	);

	const handleLongPress = useCallback(
		(ayah: Ayah) => {
			if (Platform.OS !== 'web') {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
					() => undefined,
				);
			}
			onLongPressAyah(ayah);
		},
		[onLongPressAyah],
	);

	const pageIsPlaying = pageAyahs.some(
		(a) => isActive(a.numberInQuran) && isTrackPlaying(a.numberInQuran),
	);

	return (
		<View
			style={[
				styles.pageFrame,
				{
					backgroundColor: c.surface,
					borderColor: c.border,
					shadowColor: c.cardShadow,
				},
			]}
			accessibilityLabel={ar.mushafPageA11y(page)}
		>
			<Text
				style={[
					styles.body,
					{
						fontSize,
						lineHeight,
						color: c.arabic,
						fontFamily: arabicFontFamily,
					},
				]}
				maxFontSizeMultiplier={1.85}
			>
				{pageAyahs.map((ayah) => {
					const active = isActive(ayah.numberInQuran);
					const playing =
						active && isTrackPlaying(ayah.numberInQuran);
					const loading = isTrackLoading(ayah.numberInQuran);
					const selected =
						selectedNumberInSurah === ayah.numberInSurah;
					const pinned = pinnedNumbers.has(ayah.numberInSurah);
					const highlighted = active || selected || pinned || loading;
					const tone = active
						? 'active'
						: pinned
							? 'pinned'
							: 'default';

					return (
						<Text
							key={ayah.numberInSurah}
							onPress={() => handlePress(ayah)}
							onLongPress={() => handleLongPress(ayah)}
							suppressHighlighting
							accessibilityRole='button'
							accessibilityLabel={ar.ayahA11y(ayah.numberInSurah)}
							accessibilityHint={ar.tafsirLongPressHint}
							style={
								highlighted
									? {
											backgroundColor: active
												? c.accentSoft
												: pinned
													? c.accentMutedSoft
													: c.accentSoft,
										}
									: undefined
							}
						>
							{ayah.text}
							<AyahEndMarkerText
								numberInSurah={ayah.numberInSurah}
								fontSize={fontSize}
								isDark={isDark}
								tone={tone}
								showPlaying={playing}
							/>{' '}
						</Text>
					);
				})}
			</Text>

			<View style={[styles.pageFooter, { borderTopColor: c.divider }]}>
				<View
					style={[styles.pageRule, { backgroundColor: c.border }]}
				/>
				<Text
					style={[
						styles.pageNumber,
						{ color: c.accentMuted, fontFamily: arabicFontFamily },
					]}
				>
					{convertToArabicNumerals(page)}
				</Text>
			</View>

			{pageIsPlaying ? (
				<View
					style={[styles.playingStrip, { backgroundColor: c.accent }]}
				/>
			) : null}
		</View>
	);
});

export const ContinuousAyahBlock = memo(function ContinuousAyahBlock(
	props: Props,
) {
	const pages = useMemo(() => groupAyahsByPage(props.ayahs), [props.ayahs]);

	return (
		<View style={styles.pagesStack}>
			{pages.map(({ page, ayahs: pageAyahs }) => (
				<MushafPageBlock
					key={page}
					page={page}
					pageAyahs={pageAyahs}
					fontSize={props.fontSize}
					arabicFontFamily={props.arabicFontFamily}
					isDark={props.isDark}
					selectedNumberInSurah={props.selectedNumberInSurah}
					pinnedNumbers={props.pinnedNumbers}
					isActive={props.isActive}
					isTrackPlaying={props.isTrackPlaying}
					isTrackLoading={props.isTrackLoading}
					onPressAyah={props.onPressAyah}
					onLongPressAyah={props.onLongPressAyah}
				/>
			))}
		</View>
	);
});

const styles = StyleSheet.create({
	pagesStack: {
		gap: sp.lg,
	},
	pageFrame: {
		borderRadius: 18,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: 'hidden',
		paddingHorizontal: sp.lg,
		paddingTop: sp.lg,
		paddingBottom: sp.sm,
		marginBottom: sp.lg,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 1,
	},
	body: {
		// textAlign: 'right',
		writingDirection: 'rtl',
		includeFontPadding: false,
	},
	pageFooter: {
		marginTop: sp.lg,
		paddingTop: sp.md,
		paddingBottom: sp.xs,
		borderTopWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
	},
	pageRule: {
		width: 48,
		height: 1,
		marginBottom: sp.sm,
		opacity: 0.7,
	},
	pageNumber: {
		fontSize: 15,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	playingStrip: {
		height: 3,
		width: '100%',
		opacity: 0.9,
	},
});

