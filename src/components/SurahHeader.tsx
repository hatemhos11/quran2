import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import type { SurahMeta } from '@/types';
import { getQuranFontFamily } from '@/services/fontLoader';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
	surah: SurahMeta;
	isDark: boolean;
	showTransliteration: boolean;
};

export function SurahHeader({ surah, isDark, showTransliteration }: Props) {
	const c = getAppColors(isDark);
	const isMadani = surah.revelationType === 'Medinan';
	const quranFont = getQuranFontFamily();

	return (
		<View style={styles.wrap}>
			{/* Ornamental number medallion */}
			<View style={[styles.medallionOuter, { borderColor: c.accent }]}>
				<View style={[styles.medallion, { backgroundColor: c.accent }]}>
					<Text style={[styles.medallionNum, { color: c.surface }]}>
						{surah.number}
					</Text>
				</View>
			</View>

			<Text
				style={[styles.arName, { color: c.arabic, fontFamily: quranFont }]}
				accessibilityRole='header'
			>
				{surah.name}
			</Text>

			{showTransliteration ? (
				<Text style={[styles.en, { color: c.textSecondary }]}>
					{surah.englishName}
				</Text>
			) : null}

			{/* Meta pills */}
			<View style={styles.row}>
				<View
					style={[
						styles.pill,
						{
							backgroundColor: c.surfaceMuted,
							borderColor: c.border,
						},
					]}
				>
					<Text style={[styles.pillText, { color: c.textSecondary }]}>
						{ar.subAyahs(surah.numberOfAyahs)}
					</Text>
				</View>
				<View
					style={[
						styles.pill,
						{
							backgroundColor: isMadani ? c.madaniBg : c.makkiBg,
							borderColor: 'transparent',
						},
					]}
				>
					<View
						style={[
							styles.dot,
							{
								backgroundColor: isMadani
									? c.madaniFg
									: c.makkiFg,
							},
						]}
					/>
					<Text
						style={[
							styles.pillText,
							{
								color: isMadani ? c.madaniFg : c.makkiFg,
								fontWeight: '700',
							},
						]}
					>
						{isMadani ? ar.madani : ar.makki}
					</Text>
				</View>
			</View>

			{/* Decorative divider */}
			<View style={styles.dividerRow}>
				<View
					style={[styles.dividerLine, { backgroundColor: c.border }]}
				/>
				<View style={[styles.diamond, { backgroundColor: c.accent }]} />
				<View
					style={[styles.dividerLine, { backgroundColor: c.border }]}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingHorizontal: sp.lg,
		paddingTop: sp.lg,
		paddingBottom: sp.md,
		gap: sp.sm,
		alignItems: 'center',
	},
	medallionOuter: {
		width: 64,
		height: 64,
		borderRadius: 20,
		borderWidth: 1,
		padding: 5,
		transform: [{ rotate: '45deg' }],
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: sp.sm,
	},
	medallion: {
		flex: 1,
		alignSelf: 'stretch',
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	medallionNum: {
		fontSize: 18,
		fontWeight: '700',
		transform: [{ rotate: '-45deg' }],
	},
	arName: {
		fontSize: 32,
		fontWeight: '700',
		textAlign: 'center',
		writingDirection: 'rtl',
		letterSpacing: 0.5,
	},
	en: {
		fontSize: 13,
		textAlign: 'center',
		letterSpacing: 1.5,
		textTransform: 'uppercase',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: sp.sm,
		justifyContent: 'center',
		marginTop: sp.xs,
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 999,
		borderWidth: 1,
	},
	pillText: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.3 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	dividerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: sp.md,
		marginTop: sp.md,
		width: '70%',
	},
	dividerLine: { flex: 1, height: 1 },
	diamond: {
		width: 8,
		height: 8,
		transform: [{ rotate: '45deg' }],
	},
});

