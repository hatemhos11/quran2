import React, { memo } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import {
	AYAH_MARKER_CLOSE,
	AYAH_MARKER_OPEN,
	convertToArabicNumerals,
	verseNumMarkerImage,
} from '@/utils/arabicNumerals';
import { getAppColors } from '@/utils/theme';

type MarkerTone = 'default' | 'active' | 'pinned';

type AyahEndMarkerTextProps = {
	numberInSurah: number;
	fontSize: number;
	isDark: boolean;
	tone?: MarkerTone;
	showPlaying?: boolean;
};

export const AyahEndMarkerText = memo(function AyahEndMarkerText({
	numberInSurah,
	fontSize,
	isDark,
	tone = 'default',
	showPlaying = false,
}: AyahEndMarkerTextProps) {
	const c = getAppColors(isDark);
	const digits = convertToArabicNumerals(numberInSurah);
	const markerSize = fontSize * 0.76;

	const bracketColor =
		tone === 'active'
			? c.accent
			: tone === 'pinned'
				? c.accentMuted
				: `${c.accentMuted}CC`;

	const digitColor =
		tone === 'active'
			? c.accent
			: tone === 'pinned'
				? c.accentMuted
				: c.textSecondary;

	return (
		<Text style={styles.inlineWrap} accessibilityElementsHidden importantForAccessibility='no'>
			{showPlaying ? (
				<Text style={[styles.playGlyph, { color: c.accent, fontSize: markerSize * 0.7 }]}>
					{' ▶'}
				</Text>
			) : null}
			<Text
				style={[
					styles.bracket,
					{
						color: bracketColor,
						fontSize: markerSize * 1.08,
					},
				]}
			>
				{AYAH_MARKER_OPEN}
			</Text>
			<Text
				style={[
					styles.digits,
					{
						color: digitColor,
						fontSize: markerSize * 0.94,
						backgroundColor:
							tone === 'active'
								? `${c.accent}18`
								: tone === 'pinned'
									? c.accentMutedSoft
									: 'transparent',
					},
				]}
			>
				{digits}
			</Text>
			<Text
				style={[
					styles.bracket,
					{
						color: bracketColor,
						fontSize: markerSize * 1.08,
					},
				]}
			>
				{AYAH_MARKER_CLOSE}
			</Text>
		</Text>
	);
});

type AyahEndMarkerBadgeProps = {
	numberInSurah: number;
	size: number;
	isDark: boolean;
	tone?: MarkerTone;
};

/** Ornate framed marker using `VerseNum.png` — for block layouts (cards, headers). */
export const AyahEndMarkerBadge = memo(function AyahEndMarkerBadge({
	numberInSurah,
	size,
	isDark,
	tone = 'default',
}: AyahEndMarkerBadgeProps) {
	const c = getAppColors(isDark);
	const digits = convertToArabicNumerals(numberInSurah);
	const digitColor =
		tone === 'active' ? c.surface : tone === 'pinned' ? c.accentMuted : c.accent;

	return (
		<View
			style={[
				styles.badgeWrap,
				{
					width: size,
					height: size,
					opacity: tone === 'default' ? 0.92 : 1,
				},
			]}
		>
			<ImageBackground
				source={verseNumMarkerImage}
				style={styles.badgeImage}
				imageStyle={[
					styles.badgeImageInner,
					tone === 'active' ? { tintColor: c.accent } : undefined,
				]}
				resizeMode='contain'
			>
				<Text
					style={[
						styles.badgeDigits,
						{
							color: digitColor,
							fontSize: size * 0.34,
						},
					]}
				>
					{digits}
				</Text>
			</ImageBackground>
		</View>
	);
});

const styles = StyleSheet.create({
	inlineWrap: {
		writingDirection: 'rtl',
	},
	playGlyph: {
		fontWeight: '700',
	},
	bracket: {
		fontWeight: '500',
		includeFontPadding: false,
	},
	digits: {
		fontWeight: '800',
		includeFontPadding: false,
		paddingHorizontal: 1,
		borderRadius: 4,
		overflow: 'hidden',
	},
	badgeWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeImage: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeImageInner: {
		width: '100%',
		height: '100%',
	},
	badgeDigits: {
		fontWeight: '800',
		textAlign: 'center',
		includeFontPadding: false,
		marginTop: 1,
	},
});
