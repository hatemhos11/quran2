import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ar } from '@/i18n/ar';
import type { SurahsStackParamList } from '@/navigation/types';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { SurahMeta } from '@/types';
import { matchesArabicSearch } from '@/utils/arabicSearch';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahList'>;

export function SurahListScreen({ navigation }: Props) {
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	const surahs = useQuranStore((s) => s.surahs);
	const surahsLoading = useQuranStore((s) => s.surahsLoading);
	const surahsError = useQuranStore((s) => s.surahsError);
	const loadSurahs = useQuranStore((s) => s.loadSurahs);
	const currentSurahNumber = useQuranStore((s) => s.currentSurahNumber);

	const [query, setQuery] = useState('');
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (surahs.length === 0 && !surahsLoading && !surahsError) loadSurahs();
	}, [surahs.length, surahsLoading, surahsError, loadSurahs]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadSurahs();
		} finally {
			setRefreshing(false);
		}
	}, [loadSurahs]);

	const filtered = useMemo(() => {
		const q = query.trim();
		if (!q) return surahs;
		const qLower = q.toLowerCase();
		return surahs.filter(
			(s) =>
				matchesArabicSearch(s.name, q) ||
				s.englishName.toLowerCase().includes(qLower) ||
				String(s.number) === q,
		);
	}, [surahs, query]);

	const openSurah = useCallback(
		(n: number) => navigation.navigate('SurahDetail', { surahNumber: n }),
		[navigation],
	);

	const renderItem = useCallback(
		({ item: s }: { item: SurahMeta }) => {
			const active = s.number === currentSurahNumber;
			const madani = s.revelationType === 'Medinan';
			return (
				<TouchableOpacity
					activeOpacity={0.7}
					onPress={() => openSurah(s.number)}
					accessibilityLabel={ar.surahA11y(s.number, s.englishName)}
					style={[
						styles.card,
						{
							backgroundColor: active ? c.accentSoft : c.surface,
							borderColor: active ? c.accent : c.border,
							shadowColor: c.cardShadow,
						},
					]}
				>
					<View style={styles.itemRow}>
						{/* Ornamental number badge */}
						<View style={styles.badgeWrap}>
							<View
								style={[
									styles.badge,
									{
										backgroundColor: active
											? c.accent
											: c.surfaceMuted,
									},
								]}
							>
								<Text
									style={[
										styles.num,
										{
											color: active
												? c.surface
												: c.accent,
										},
									]}
								>
									{s.number}
								</Text>
							</View>
						</View>

						{/* Middle: Arabic name + english + ayah count */}
						<View style={styles.itemMid}>
							<Text
								style={[styles.ar, { color: c.arabic }]}
								numberOfLines={1}
							>
								{s.name}
							</Text>
							<Text
								style={[
									styles.english,
									{ color: c.textSecondary },
								]}
								numberOfLines={1}
							>
								{s.englishName} · {ar.subAyahs(s.numberOfAyahs)}
							</Text>
						</View>

						{/* Right: revelation tag */}
						<View
							style={[
								styles.tag,
								{
									backgroundColor: madani
										? c.madaniBg
										: c.makkiBg,
								},
							]}
						>
							<Text
								style={[
									styles.tagText,
									{ color: madani ? c.madaniFg : c.makkiFg },
								]}
							>
								{madani ? ar.madani : ar.makki}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			);
		},
		[c, currentSurahNumber, openSurah],
	);

	if (surahsError && surahs.length === 0) {
		return (
			<SafeAreaView
				style={[styles.root, { backgroundColor: c.background }]}
				edges={['top']}
			>
				<Header title={ar.surahs} subtitle={ar.surahs} color={c} />
				<EmptyState
					isDark={isDark}
					title={ar.couldNotLoadSurahs}
					message={surahsError}
					onRetry={loadSurahs}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<Header
				title={ar.surahs}
				subtitle={`${surahs.length} ${ar.surahs}`}
				color={c}
			/>

			<Searchbar
				placeholder={ar.searchPlaceholder}
				value={query}
				onChangeText={setQuery}
				style={[
					styles.search,
					{ backgroundColor: c.surface, borderColor: c.border },
				]}
				inputStyle={{
					color: c.text,

					writingDirection: 'rtl',
					fontSize: 15,
				}}
				iconColor={c.textSecondary}
				placeholderTextColor={c.textTertiary}
				accessibilityLabel={ar.filterSurahs}
				elevation={0}
			/>

			<FlatList
				style={styles.list}
				data={filtered}
				keyExtractor={(s) => String(s.number)}
				renderItem={renderItem}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={c.accent}
						colors={[c.accent]}
					/>
				}
				ItemSeparatorComponent={() => (
					<View style={{ height: sp.sm }} />
				)}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<Text
						style={{
							textAlign: 'center',
							marginTop: sp.xl,
							color: c.textSecondary,
						}}
					>
						{surahsLoading ? ar.loading : ar.noMatches}
					</Text>
				}
			/>
		</SafeAreaView>
	);
}

function Header({
	title,
	subtitle,
	color: c,
}: {
	title: string;
	subtitle: string;
	color: ReturnType<typeof getAppColors>;
}) {
	return (
		<View style={styles.header}>
			<Text style={[styles.headerTitle, { color: c.text }]}>{title}</Text>
			<Text style={[styles.headerSubtitle, { color: c.textTertiary }]}>
				{subtitle}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	header: {
		paddingHorizontal: sp.lg,
		paddingTop: sp.md,
		paddingBottom: sp.sm,
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: '700',
		writingDirection: 'rtl',
		letterSpacing: 0.2,
	},
	headerSubtitle: {
		fontSize: 12,
		marginTop: 2,
		writingDirection: 'rtl',
	},
	search: {
		marginHorizontal: sp.md,
		marginTop: sp.xs,
		marginBottom: sp.md,
		borderRadius: 14,
		borderWidth: 1,
		elevation: 0,
		height: 48,
	},
	list: { flex: 1 },
	listContent: {
		flexGrow: 1,
		paddingHorizontal: sp.md,
		paddingBottom: sp.xl,
	},
	card: {
		borderRadius: 16,
		borderWidth: 1,
		paddingVertical: sp.md,
		paddingHorizontal: sp.md,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 1,
	},
	itemRow: {
		flexDirection: 'row-reverse', // RTL layout: badge on right visually is achieved via reverse
		alignItems: 'center',
		gap: sp.md,
	},
	badgeWrap: { justifyContent: 'center', alignItems: 'center' },
	badge: {
		width: 40,
		height: 40,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		transform: [{ rotate: '45deg' }],
	},
	num: {
		fontSize: 14,
		fontWeight: '700',
		transform: [{ rotate: '-45deg' }],
	},
	itemMid: { flex: 1, gap: 2 },
	ar: {
		fontSize: 19,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	english: {
		fontSize: 12,
		writingDirection: 'rtl',
		letterSpacing: 0.2,
	},
	tag: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	tagText: {
		fontSize: 10.5,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
});

