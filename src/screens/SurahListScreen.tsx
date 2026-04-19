import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Divider, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ar } from '@/i18n/ar';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { SurahMeta } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

export function SurahListScreen({ navigation }: DrawerContentComponentProps) {
	const insets = useSafeAreaInsets();
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	const surahs = useQuranStore((s) => s.surahs);
	const surahsLoading = useQuranStore((s) => s.surahsLoading);
	const surahsError = useQuranStore((s) => s.surahsError);
	const loadSurahs = useQuranStore((s) => s.loadSurahs);
	const downloadedSurahs = useQuranStore((s) => s.downloadedSurahs);
	const currentSurahNumber = useQuranStore((s) => s.currentSurahNumber);
	const refreshDownloaded = useQuranStore((s) => s.refreshDownloaded);

	const [query, setQuery] = useState('');
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (surahs.length === 0 && !surahsLoading && !surahsError) {
			loadSurahs();
		}
	}, [surahs.length, surahsLoading, surahsError, loadSurahs]);

	useEffect(() => {
		refreshDownloaded();
	}, [refreshDownloaded]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadSurahs();
			await refreshDownloaded();
		} finally {
			setRefreshing(false);
		}
	}, [loadSurahs, refreshDownloaded]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return surahs;
		return surahs.filter(
			(s) =>
				s.name.includes(query) ||
				s.englishName.toLowerCase().includes(q) ||
				String(s.number) === q,
		);
	}, [surahs, query]);

	const openSurah = useCallback(
		(n: number) => {
			navigation.navigate(
				'Main' as never,
				{
					screen: 'SurahDetail',
					params: { surahNumber: n },
				} as never,
			);
			navigation.closeDrawer();
		},
		[navigation],
	);

	const renderItem = useCallback(
		({ item: s }: { item: SurahMeta }) => {
			const saved = downloadedSurahs.includes(s.number);
			const active = s.number === currentSurahNumber;
			const madani = s.revelationType === 'Medinan';
			return (
				<TouchableOpacity
					style={[
						styles.item,
						{
							backgroundColor: active
								? `${c.accent}22`
								: 'transparent',
						},
					]}
					onPress={() => openSurah(s.number)}
					accessibilityLabel={ar.surahA11y(s.number, s.englishName)}
				>
					<View style={styles.itemRow}>
						<View
							style={{
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Text style={[styles.num, { color: c.accent }]}>
								{s.number}
							</Text>
							<Text
								style={[
									styles.tag,
									{
										color: madani
											? c.accentMuted
											: c.accent,
									},
								]}
							>
								{madani ? ar.madani : ar.makki}
							</Text>
						</View>
						<View style={styles.itemMid}>
							<Text style={[styles.ar, { color: c.arabic }]}>
								{s.name}
							</Text>
							<View>
								<Text
									style={[
										styles.sub,
										{ color: c.textSecondary },
									]}
								>
									{ar.subAyahs(s.numberOfAyahs)}
								</Text>
							</View>
						</View>
						<MaterialCommunityIcons
							name={
								saved ? 'cloud-check-outline' : 'cloud-outline'
							}
							size={20}
							color={saved ? c.accent : c.textSecondary}
						/>
					</View>
				</TouchableOpacity>
			);
		},
		[c, currentSurahNumber, downloadedSurahs, openSurah],
	);

	if (surahsError && surahs.length === 0) {
		return (
			<View
				style={[
					styles.drawerRoot,
					styles.ltr,
					{
						paddingTop: insets.top,
						backgroundColor: c.background,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<Text
					variant='titleLarge'
					style={[styles.drawerTitle, { color: c.text }]}
				>
					{ar.surahs}
				</Text>
				<EmptyState
					isDark={isDark}
					title={ar.couldNotLoadSurahs}
					message={surahsError}
					onRetry={loadSurahs}
				/>
			</View>
		);
	}

	return (
		<View
			style={[
				styles.drawerRoot,
				styles.ltr,
				{
					paddingTop: insets.top,
					backgroundColor: c.background,
					paddingBottom: insets.bottom,
				},
			]}
		>
			<Searchbar
				placeholder={ar.searchPlaceholder}
				value={query}
				onChangeText={setQuery}
				style={[styles.search, { backgroundColor: c.surface }]}
				inputStyle={{
					color: c.text,
					textAlign: 'right',
					writingDirection: 'rtl',
				}}
				iconColor={c.textSecondary}
				placeholderTextColor={c.textSecondary}
				accessibilityLabel={ar.filterSurahs}
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
					/>
				}
				ItemSeparatorComponent={() => <Divider />}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					surahsLoading ? (
						<Text
							style={{
								textAlign: 'center',
								marginTop: sp.xl,
								color: c.textSecondary,
							}}
						>
							{ar.loading}
						</Text>
					) : (
						<Text
							style={{
								textAlign: 'center',
								marginTop: sp.xl,
								color: c.textSecondary,
							}}
						>
							{ar.noMatches}
						</Text>
					)
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	drawerRoot: { flex: 1, width: '92%', alignSelf: 'flex-end' },
	ltr: { direction: 'ltr' },
	list: { flex: 1, width: '100%' },
	listContent: { flexGrow: 1, paddingBottom: sp.md },
	drawerTitle: { paddingHorizontal: sp.lg, paddingVertical: sp.md },
	search: {
		marginHorizontal: sp.md,
		marginBottom: sp.sm,
		maxWidth: 250,
		alignSelf: 'center',
	},
	item: { paddingVertical: sp.md, paddingHorizontal: sp.lg },
	itemRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
	num: { fontSize: 15, fontWeight: '700' },
	itemMid: { flex: 1, gap: 2 },
	ar: { fontSize: 17, textAlign: 'right', writingDirection: 'rtl' },
	sub: { fontSize: 12, textAlign: 'right' },
	tagRow: { flexDirection: 'row', marginTop: 2 },
	tag: { fontSize: 11, fontWeight: '600' },
});

