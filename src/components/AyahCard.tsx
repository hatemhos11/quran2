import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import type { Ayah } from '@/types';
import { ayahEndMarker } from '@/utils/arabicNumerals';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
	ayah: Ayah;
	fontSize: number;
	arabicFontFamily?: string;
	isDark: boolean;
	selected: boolean;
	isPinned: boolean;
	onLongPressAyah: (ayah: Ayah) => void;
};

export const AyahCard = memo(function AyahCard({
	ayah,
	fontSize,
	arabicFontFamily,
	isDark,
	selected,
	isPinned,
	onLongPressAyah,
}: Props) {
	const c = getAppColors(isDark);
	const lineHeight = fontSize * 1.85;
	const markerSize = fontSize * 0.88;
	const pinBg = isDark ? 'rgba(255, 193, 7, 0.16)' : 'rgba(255, 193, 7, 0.14)';
	const pinBorder = isDark ? 'rgba(255, 193, 7, 0.45)' : '#E6C35C';
	const highlightBg = isDark
		? 'rgba(76, 175, 80, 0.22)'
		: 'rgba(76, 175, 80, 0.15)';
	const cardBg = isPinned
		? pinBg
		: selected
			? highlightBg
			: c.surface;
	const cardBorder = isPinned
		? pinBorder
		: isDark
			? '#37474F'
			: '#E8E4D9';

	const handleLongPress = useCallback(() => {
		if (Platform.OS !== 'web') {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
				() => undefined,
			);
		}
		onLongPressAyah(ayah);
	}, [ayah, onLongPressAyah]);

	return (
		<Pressable
			onLongPress={handleLongPress}
			delayLongPress={480}
			accessibilityRole='button'
			accessibilityLabel={ar.ayahA11y(ayah.numberInSurah)}
			accessibilityHint={ar.tafsirLongPressHint}
			style={({ pressed }) => [
				styles.card,
				{
					backgroundColor: cardBg,
					borderColor: cardBorder,
					borderWidth: isPinned ? 1.5 : StyleSheet.hairlineWidth,
					shadowColor: isDark ? '#000' : c.cardShadow,
					opacity: pressed ? 0.92 : 1,
				},
			]}
		>
			<View style={[styles.inner, { backgroundColor: cardBg }]}>
				<Text
					style={[
						styles.ayahText,
						{
							fontSize,
							lineHeight,
							color: c.arabic,
							fontFamily: arabicFontFamily,
						},
					]}
					maxFontSizeMultiplier={1.85}
				>
					{ayah.text}{' '}
					<Text
						style={[
							styles.marker,
							{
								fontSize: markerSize,
								lineHeight: markerSize * 1.5,
								color: c.accent,
								fontFamily: arabicFontFamily,
							},
						]}
						maxFontSizeMultiplier={1.85}
					>
						{ayahEndMarker(ayah.numberInSurah)}
					</Text>
				</Text>
			</View>
		</Pressable>
	);
});

const styles = StyleSheet.create({
	card: {
		marginBottom: sp.md + 2,
		borderRadius: sp.md + 2,
		overflow: 'hidden',
		elevation: 1,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 3,
	},
	inner: {
		paddingHorizontal: sp.xl,
		paddingVertical: sp.lg,
		writingDirection: 'rtl',
	},
	ayahText: {
		textAlign: 'justify',
		writingDirection: 'rtl',
		includeFontPadding: false,
	},
	marker: {
		marginTop: sp.sm + 2,
		textAlign: 'left',
		writingDirection: 'rtl',
		includeFontPadding: false,
	},
});

