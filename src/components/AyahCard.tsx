import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import type { Ayah } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
	ayah: Ayah;
	fontSize: number;
	arabicFontFamily?: string;
	isDark: boolean;
	selected: boolean;
	isPinned: boolean;
	isActive: boolean;
	isPlaying: boolean;
	isLoadingAudio: boolean;
	onPressPlay: (ayah: Ayah) => void;
	onLongPressAyah: (ayah: Ayah) => void;
};

export const AyahCard = memo(function AyahCard({
	ayah,
	fontSize,
	arabicFontFamily,
	isDark,
	selected,
	isPinned,
	isActive,
	isPlaying,
	isLoadingAudio,
	onPressPlay,
	onLongPressAyah,
}: Props) {
	const c = getAppColors(isDark);
	const lineHeight = fontSize * 2.1;

	// State-driven surface
	const cardBg = isActive
		? c.accentSoft
		: isPinned
			? c.accentMutedSoft
			: selected
				? c.accentSoft
				: c.surface;

	const cardBorder = isActive
		? c.accent
		: isPinned
			? c.accentMuted
			: selected
				? c.accent
				: c.border;

	const handlePlayPress = useCallback(() => {
		if (Platform.OS !== 'web') {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
				() => undefined,
			);
		}
		onPressPlay(ayah);
	}, [ayah, onPressPlay]);

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
					borderWidth:
						isActive || isPinned || selected
							? 1.2
							: StyleSheet.hairlineWidth,
					shadowColor: c.cardShadow,
					opacity: pressed ? 0.94 : 1,
				},
			]}
		>
			{/* Top rail: ayah number diamond + controls */}
			<View style={styles.rail}>
				<View
					style={[
						styles.numberDiamond,
						{
							backgroundColor: isActive
								? c.accent
								: c.surfaceMuted,
							borderColor: isActive ? c.accent : c.border,
						},
					]}
				>
					<Text
						style={[
							styles.numberText,
							{ color: isActive ? c.surface : c.accent },
						]}
					>
						{ayah.numberInSurah}
					</Text>
				</View>

				<View style={styles.railActions}>
					{isPinned ? (
						<IconButton
							icon='bookmark'
							size={18}
							iconColor={c.accentMuted}
							style={styles.iconBtn}
							disabled
						/>
					) : null}
					{isLoadingAudio ? (
						<ActivityIndicator
							size='small'
							color={c.accent}
							style={styles.spinner}
						/>
					) : (
						<IconButton
							icon={
								isActive && isPlaying
									? 'pause-circle'
									: 'play-circle'
							}
							size={28}
							onPress={handlePlayPress}
							iconColor={isActive ? c.accent : c.textSecondary}
							accessibilityLabel={
								isActive && isPlaying
									? ar.pauseAyahAudioA11y
									: ar.playAyahAudioA11y
							}
							style={styles.iconBtn}
						/>
					)}
				</View>
			</View>

			{/* Ayah text */}
			<View style={styles.inner}>
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
					{ayah.text}
				</Text>
			</View>

			{/* Playing indicator strip */}
			{isActive && isPlaying ? (
				<View
					style={[styles.playingStrip, { backgroundColor: c.accent }]}
				/>
			) : null}
		</Pressable>
	);
});

const styles = StyleSheet.create({
	card: {
		marginBottom: sp.md,
		borderRadius: 18,
		overflow: 'hidden',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 1,
	},
	rail: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: sp.md,
		paddingTop: sp.sm,
	},
	numberDiamond: {
		width: 32,
		height: 32,
		borderRadius: 10,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		transform: [{ rotate: '45deg' }],
	},
	numberText: {
		fontSize: 12,
		fontWeight: '700',
		transform: [{ rotate: '-45deg' }],
	},
	railActions: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
	},
	iconBtn: { margin: 0 },
	spinner: { marginHorizontal: sp.md },
	inner: {
		paddingHorizontal: sp.lg,
		paddingTop: sp.sm,
		paddingBottom: sp.lg,
	},
	ayahText: {
		textAlign: 'justify',
		writingDirection: 'rtl',
		includeFontPadding: false,
	},
	playingStrip: {
		height: 3,
		width: '100%',
		opacity: 0.9,
	},
});

