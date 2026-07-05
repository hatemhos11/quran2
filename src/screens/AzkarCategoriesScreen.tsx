import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	View,
} from 'react-native';
import { IconButton, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ar } from '@/i18n/ar';
import type { AzkarStackParamList } from '@/navigation/types';
import { searchAzkarCategories } from '@/services/offlineStorage';
import {
	sortAzkarCategories,
	usePinnedAzkarStore,
} from '@/store/pinnedAzkarStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { AzkarCategory } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<AzkarStackParamList, 'AzkarCategories'>;

export function AzkarCategoriesScreen({ navigation }: Props) {
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	const [categories, setCategories] = useState<AzkarCategory[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	const pinnedCategories = usePinnedAzkarStore((s) => s.pinnedCategories);
	const togglePin = usePinnedAzkarStore((s) => s.togglePin);
	const isPinned = usePinnedAzkarStore((s) => s.isPinned);

	const sortedCategories = useMemo(
		() => sortAzkarCategories(categories, pinnedCategories),
		[categories, pinnedCategories],
	);

	const pinnedCount = useMemo(
		() =>
			sortedCategories.filter((c) => pinnedCategories.includes(c.name))
				.length,
		[sortedCategories, pinnedCategories],
	);

	const load = useCallback(async (search = '') => {
		try {
			setError(null);
			const list = await searchAzkarCategories(search);
			setCategories(list);
		} catch {
			setError(ar.azkarLoadError);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		const timer = setTimeout(() => {
			void load(query);
		}, 200);
		return () => clearTimeout(timer);
	}, [query, load]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await load(query);
		} finally {
			setRefreshing(false);
		}
	}, [load, query]);

	const cardBorder = isDark
		? 'rgba(255,255,255,0.08)'
		: 'rgba(44,62,80,0.08)';

	const renderItem = useCallback(
		({ item, index }: { item: AzkarCategory; index: number }) => {
			const pinned = isPinned(item.name);
			const showPinnedHeader =
				pinnedCount > 0 && pinned && index === 0 && !query.trim();
			const showAllHeader =
				pinnedCount > 0 &&
				!query.trim() &&
				index === pinnedCount &&
				pinnedCount < sortedCategories.length;

			return (
				<>
					{showPinnedHeader ? (
						<Text
							style={[
								styles.sectionLabel,
								{ color: c.textSecondary },
							]}
						>
							{ar.azkarPinnedSection}
						</Text>
					) : null}
					{showAllHeader ? (
						<Text
							style={[
								styles.sectionLabel,
								styles.sectionLabelSpaced,
								{ color: c.textSecondary },
							]}
						>
							{ar.azkarAllCategories}
						</Text>
					) : null}
					<View
						style={[
							styles.card,
							{
								backgroundColor: c.surface,
								borderColor: pinned
									? `${c.accent}55`
									: cardBorder,
							},
						]}
					>
						<Pressable
							onPress={() =>
								navigation.navigate('AzkarCategory', {
									category: item.name,
								})
							}
							style={({ pressed }) => [
								styles.cardMain,
								{
									opacity: pressed ? 0.92 : 1,
									transform: [{ scale: pressed ? 0.985 : 1 }],
								},
							]}
							accessibilityRole='button'
							accessibilityLabel={item.name}
						>
							<View
								style={[
									styles.iconWrap,
									{ backgroundColor: `${c.accent}18` },
								]}
							>
								<MaterialCommunityIcons
									name='hands-pray'
									size={22}
									color={c.accent}
								/>
							</View>
							<View style={styles.cardBody}>
								<Text
									style={[
										styles.cardTitle,
										{ color: c.text },
									]}
									numberOfLines={2}
								>
									{item.name}
								</Text>
								<Text
									style={[
										styles.cardMeta,
										{ color: c.textSecondary },
									]}
								>
									{ar.azkarItems(item.itemCount)}
								</Text>
							</View>
							<View
								style={[
									styles.countBadge,
									{ backgroundColor: `${c.accentMuted}22` },
								]}
							>
								<Text
									style={[
										styles.countText,
										{ color: c.accentMuted },
									]}
								>
									{item.itemCount}
								</Text>
							</View>
							<MaterialCommunityIcons
								name='chevron-left'
								size={22}
								color={c.textSecondary}
							/>
						</Pressable>
						<IconButton
							icon={pinned ? 'pin' : 'pin-outline'}
							size={20}
							onPress={() => togglePin(item.name)}
							iconColor={pinned ? c.accent : c.textSecondary}
							accessibilityLabel={
								pinned
									? ar.unpinAzkarCategoryA11y
									: ar.pinAzkarCategoryA11y
							}
							style={styles.pinButton}
						/>
					</View>
				</>
			);
		},
		[
			c,
			cardBorder,
			isPinned,
			navigation,
			pinnedCount,
			query,
			sortedCategories.length,
			togglePin,
		],
	);

	const header = useMemo(
		() => (
			<View style={styles.header}>
				<Text style={[styles.title, { color: c.text }]}>
					{ar.azkar}
				</Text>
				<Text style={[styles.subtitle, { color: c.textSecondary }]}>
					{categories.length > 0
						? ar.azkarCategoriesCount(categories.length)
						: ' '}
				</Text>
				<Searchbar
					placeholder={ar.azkarSearchPlaceholder}
					value={query}
					onChangeText={setQuery}
					style={[
						styles.search,
						{
							backgroundColor: isDark
								? c.surface
								: c.surfaceElevated,
						},
					]}
					inputStyle={{
						color: c.text,
						writingDirection: 'rtl',
					}}
					iconColor={c.textSecondary}
					placeholderTextColor={c.textSecondary}
					elevation={0}
				/>
			</View>
		),
		[c, categories.length, isDark, query],
	);

	if (error && categories.length === 0) {
		return (
			<SafeAreaView
				style={[styles.root, { backgroundColor: c.background }]}
				edges={['top']}
			>
				{header}
				<EmptyState
					isDark={isDark}
					title={ar.somethingWrong}
					message={error}
					onRetry={() => load(query)}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<FlatList
				data={sortedCategories}
				keyExtractor={(item) => item.name}
				renderItem={renderItem}
				ListHeaderComponent={header}
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={c.accent}
					/>
				}
				ListEmptyComponent={
					!loading ? (
						<Text
							style={[styles.empty, { color: c.textSecondary }]}
						>
							{ar.azkarNoResults}
						</Text>
					) : null
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	header: {
		paddingHorizontal: sp.lg,
		paddingTop: sp.sm,
		paddingBottom: sp.md,
		gap: sp.xs,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	subtitle: {
		fontSize: 13,
		writingDirection: 'rtl',
		marginBottom: sp.sm,
	},
	search: {
		borderRadius: 14,
	},
	listContent: {
		paddingHorizontal: sp.lg,
		paddingBottom: sp.xl,
	},
	separator: { height: sp.sm },
	sectionLabel: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
		marginBottom: sp.xs,
	},
	sectionLabelSpaced: {
		marginTop: sp.sm,
	},
	card: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		borderRadius: 16,
		borderWidth: 1,
		overflow: 'hidden',
	},
	cardMain: {
		flex: 1,
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.md,
		padding: sp.md,
		paddingLeft: 0,
	},
	pinButton: {
		margin: 0,
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardBody: {
		flex: 1,
		gap: 4,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		writingDirection: 'rtl',
		lineHeight: 24,
	},
	cardMeta: {
		fontSize: 12,
		writingDirection: 'rtl',
	},
	countBadge: {
		minWidth: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 8,
	},
	countText: {
		fontSize: 12,
		fontWeight: '700',
	},
	empty: {
		textAlign: 'center',
		marginTop: sp.xxl,
		writingDirection: 'rtl',
	},
});

