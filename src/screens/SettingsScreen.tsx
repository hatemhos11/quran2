import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import Constants from 'expo-constants';
import React, { useEffect, useMemo } from 'react';
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	View,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ar } from '@/i18n/ar';
import type { SettingsStackParamList } from '@/navigation/types';
import { getQuranFontFamily } from '@/services/fontLoader';
import { useReciterStore } from '@/store/reciterStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { AyahLayoutMode, ThemeMode } from '@/types';
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { getAppColors, type AppColors } from '@/utils/theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

function SectionHeader({
	icon,
	label,
	c,
}: {
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	label: string;
	c: AppColors;
}) {
	return (
		<View style={styles.sectionHeader}>
			<MaterialCommunityIcons
				name={icon}
				size={16}
				color={c.accent}
			/>
			<Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
				{label}
			</Text>
		</View>
	);
}

function SettingsCard({
	children,
	c,
	isDark,
	style,
}: {
	children: React.ReactNode;
	c: AppColors;
	isDark: boolean;
	style?: object;
}) {
	const border = isDark
		? 'rgba(255,255,255,0.08)'
		: 'rgba(44,62,80,0.08)';

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: c.surface, borderColor: border },
				style,
			]}
		>
			{children}
		</View>
	);
}

function OptionPill({
	label,
	selected,
	onPress,
	c,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
	c: AppColors;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.pill,
				{
					backgroundColor: selected ? c.accentSoft : c.surfaceMuted,
					borderColor: selected ? `${c.accent}55` : 'transparent',
					opacity: pressed ? 0.85 : 1,
				},
			]}
			accessibilityRole='button'
			accessibilityState={{ selected }}
		>
			<Text
				style={[
					styles.pillText,
					{ color: selected ? c.accent : c.text },
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

export function SettingsScreen() {
	const navigation = useNavigation<Nav>();
	const insets = useSafeAreaInsets();
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	const fontSize = useSettingsStore((s) => s.fontSize);
	const setFontSize = useSettingsStore((s) => s.setFontSize);
	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);
	const showTransliteration = useSettingsStore((s) => s.showTransliteration);
	const setShowTransliteration = useSettingsStore(
		(s) => s.setShowTransliteration,
	);
	const ayahLayout = useSettingsStore((s) => s.ayahLayout);
	const setAyahLayout = useSettingsStore((s) => s.setAyahLayout);
	const preferredReciter = useSettingsStore((s) => s.preferredReciter);

	const reciters = useReciterStore((s) => s.reciters);
	const loadReciters = useReciterStore((s) => s.loadReciters);

	useEffect(() => {
		void loadReciters();
	}, [loadReciters]);

	const reciterLabel = useMemo(() => {
		const match = reciters.find((r) => r.identifier === preferredReciter);
		return match?.name ?? ar.reciterDefaultLabel;
	}, [preferredReciter, reciters]);

	const previewArabic = useMemo(() => 'قُلْ هُوَ اللَّهُ أَحَدٌ', []);
	const quranFont = getQuranFontFamily();

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + sp.xxl * 2 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: c.text }]}>
						{ar.settings}
					</Text>
				</View>

				<SectionHeader icon='book-open-variant' label={ar.reading} c={c} />
				<SettingsCard c={c} isDark={isDark}>
					<View style={styles.cardPad}>
						<View style={styles.sliderHeader}>
							<Text style={[styles.rowTitle, { color: c.text }]}>
								{ar.arabicSize(fontSize)}
							</Text>
							<View
								style={[
									styles.sizeBadge,
									{ backgroundColor: c.accentSoft },
								]}
							>
								<Text
									style={[styles.sizeBadgeText, { color: c.accent }]}
								>
									{Math.round(fontSize)}
								</Text>
							</View>
						</View>
						<Slider
							minimumValue={FONT_SIZE_MIN}
							maximumValue={FONT_SIZE_MAX}
							step={1}
							value={fontSize}
							onValueChange={setFontSize}
							minimumTrackTintColor={c.accent}
							maximumTrackTintColor={c.surfaceMuted}
							thumbTintColor={c.accent}
							accessibilityLabel={ar.arabicSize(fontSize)}
						/>
						<View
							style={[
								styles.previewBox,
								{ backgroundColor: c.accentSoft },
							]}
						>
							<Text
								style={{
									fontSize,
									lineHeight: fontSize * 2.2,
									color: c.arabic,
									textAlign: 'center',
									fontFamily: quranFont,
								}}
							>
								{previewArabic}
							</Text>
							<Text
								style={[
									styles.fontCaption,
									{ color: c.textSecondary },
								]}
							>
								{ar.readingFontName}
							</Text>
						</View>
					</View>

					<View style={[styles.divider, { backgroundColor: c.divider }]} />

					<View style={styles.toggleRow}>
						<View style={styles.toggleCopy}>
							<Text style={[styles.rowTitle, { color: c.text }]}>
								{ar.transliterationTitle}
							</Text>
							<Text
								style={[
									styles.rowDesc,
									{ color: c.textSecondary },
								]}
							>
								{ar.transliterationDesc}
							</Text>
						</View>
						<Switch
							value={showTransliteration}
							onValueChange={setShowTransliteration}
							trackColor={{
								false: c.surfaceMuted,
								true: `${c.accent}88`,
							}}
							thumbColor={showTransliteration ? c.accent : c.textTertiary}
							accessibilityLabel={ar.transliterationTitle}
						/>
					</View>
				</SettingsCard>

				<SettingsCard c={c} isDark={isDark}>
					<View style={styles.cardPad}>
						<Text style={[styles.rowTitle, { color: c.text }]}>
							{ar.continuousAyahsTitle}
						</Text>
						<Text style={[styles.rowDesc, { color: c.textSecondary }]}>
							{ar.continuousAyahsDesc}
						</Text>
						<View style={[styles.pillRow, { marginTop: sp.md }]}>
							{(['cards', 'continuous'] as AyahLayoutMode[]).map(
								(mode) => (
									<OptionPill
										key={mode}
										label={
											mode === 'cards'
												? ar.ayahLayoutCards
												: ar.ayahLayoutContinuous
										}
										selected={ayahLayout === mode}
										onPress={() => setAyahLayout(mode)}
										c={c}
									/>
								),
							)}
						</View>
					</View>
				</SettingsCard>

				<SectionHeader icon='account-voice' label={ar.recitation} c={c} />
				<SettingsCard c={c} isDark={isDark}>
					<Pressable
						onPress={() => navigation.navigate('ReciterPicker')}
						style={({ pressed }) => [
							styles.navRow,
							{ opacity: pressed ? 0.88 : 1 },
						]}
						accessibilityRole='button'
					>
						<View
							style={[
								styles.iconWrap,
								{ backgroundColor: `${c.accent}18` },
							]}
						>
							<MaterialCommunityIcons
								name='account-voice'
								size={20}
								color={c.accent}
							/>
						</View>
						<View style={styles.navCopy}>
							<Text style={[styles.rowTitle, { color: c.text }]}>
								{ar.defaultReciter}
							</Text>
							<Text
								style={[
									styles.rowDesc,
									{ color: c.textSecondary },
								]}
								numberOfLines={1}
							>
								{reciterLabel}
							</Text>
						</View>
						<MaterialCommunityIcons
							name='chevron-left'
							size={22}
							color={c.textSecondary}
						/>
					</Pressable>
				</SettingsCard>

				<SectionHeader icon='palette-outline' label={ar.appearance} c={c} />
				<SettingsCard c={c} isDark={isDark}>
					<View style={[styles.pillRow, styles.cardPad]}>
						{(['light', 'dark'] as ThemeMode[]).map((mode) => (
							<Pressable
								key={mode}
								onPress={() => setTheme(mode)}
								style={({ pressed }) => [
									styles.themePill,
									{
										backgroundColor:
											theme === mode
												? c.accentSoft
												: c.surfaceMuted,
										borderColor:
											theme === mode
												? `${c.accent}55`
												: 'transparent',
										opacity: pressed ? 0.85 : 1,
									},
								]}
								accessibilityRole='button'
								accessibilityState={{ selected: theme === mode }}
							>
								<MaterialCommunityIcons
									name={
										mode === 'light'
											? 'white-balance-sunny'
											: 'moon-waning-crescent'
									}
									size={20}
									color={theme === mode ? c.accent : c.textSecondary}
								/>
								<Text
									style={[
										styles.pillText,
										{
											color:
												theme === mode ? c.accent : c.text,
										},
									]}
								>
									{mode === 'light' ? ar.light : ar.dark}
								</Text>
							</Pressable>
						))}
					</View>
				</SettingsCard>

				<SectionHeader icon='information-outline' label={ar.about} c={c} />
				<SettingsCard c={c} isDark={isDark} style={styles.aboutCard}>
					<View style={styles.aboutInner}>
						<View
							style={[
								styles.aboutIcon,
								{ backgroundColor: `${c.accent}18` },
							]}
						>
							<MaterialCommunityIcons
								name='book-open-page-variant'
								size={28}
								color={c.accent}
							/>
						</View>
						<Text style={[styles.aboutName, { color: c.text }]}>
							{ar.appName}
						</Text>
						<Text
							style={[styles.aboutDesc, { color: c.textSecondary }]}
						>
							{ar.aboutDesc(dayjs().format('YYYY'))}
						</Text>
						{Constants.expoConfig?.version ? (
							<View
								style={[
									styles.versionBadge,
									{ backgroundColor: c.surfaceMuted },
								]}
							>
								<Text
									style={[
										styles.versionText,
										{ color: c.textSecondary },
									]}
								>
									{ar.version} {Constants.expoConfig.version}
								</Text>
							</View>
						) : null}
					</View>
				</SettingsCard>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	scroll: { flex: 1 },
	content: {
		paddingHorizontal: sp.lg,
		gap: sp.sm,
	},
	header: {
		paddingTop: sp.sm,
		paddingBottom: sp.md,
		gap: sp.xs,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	sectionHeader: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.sm,
		marginTop: sp.sm,
		marginBottom: sp.xs,
		paddingHorizontal: sp.xs,
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	card: {
		borderRadius: 16,
		borderWidth: 1,
		overflow: 'hidden',
	},
	cardPad: {
		padding: sp.lg,
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: sp.lg,
	},
	sliderHeader: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: sp.xs,
	},
	sizeBadge: {
		minWidth: 36,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: sp.md,
	},
	sizeBadgeText: {
		fontSize: 13,
		fontWeight: '700',
	},
	previewBox: {
		borderRadius: 12,
		paddingVertical: sp.lg,
		paddingHorizontal: sp.md,
		marginTop: sp.md,
		gap: sp.sm,
	},
	fontCaption: {
		fontSize: 12,
		textAlign: 'center',
		writingDirection: 'rtl',
	},
	toggleRow: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.lg,
		padding: sp.lg,
	},
	toggleCopy: {
		flex: 1,
		gap: 2,
	},
	rowTitle: {
		fontSize: 15,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	rowDesc: {
		fontSize: 12,
		writingDirection: 'rtl',
		lineHeight: 18,
	},
	pillRow: {
		flexDirection: 'row-reverse',
		flexWrap: 'wrap',
		gap: sp.sm,
	},
	pill: {
		flexGrow: 1,
		flexBasis: '30%',
		borderRadius: 12,
		borderWidth: 1,
		paddingVertical: sp.md,
		paddingHorizontal: sp.sm,
		alignItems: 'center',
	},
	pillText: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	themePill: {
		flex: 1,
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'center',
		gap: sp.sm,
		borderRadius: 12,
		borderWidth: 1,
		paddingVertical: sp.lg,
	},
	navRow: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.md,
		padding: sp.lg,
	},
	iconWrap: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	navCopy: {
		flex: 1,
		gap: 2,
	},
	aboutCard: {
		marginTop: sp.xs,
	},
	aboutInner: {
		alignItems: 'center',
		padding: sp.xl,
		gap: sp.md,
	},
	aboutIcon: {
		width: 56,
		height: 56,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	aboutName: {
		fontSize: 18,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	aboutDesc: {
		fontSize: 12,
		writingDirection: 'rtl',
		textAlign: 'center',
		lineHeight: 18,
	},
	versionBadge: {
		borderRadius: 20,
		paddingHorizontal: sp.lg,
		paddingVertical: sp.xs,
	},
	versionText: {
		fontSize: 12,
		fontWeight: '500',
	},
});
