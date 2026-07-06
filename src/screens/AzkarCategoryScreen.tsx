import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ar } from '@/i18n/ar';
import type { AzkarStackParamList } from '@/navigation/types';
import { getQuranFontFamily } from '@/services/fontLoader';
import { loadAzkarByCategory } from '@/services/offlineStorage';
import { useSettingsStore } from '@/store/settingsStore';
import type { AzkarItem } from '@/types';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = NativeStackScreenProps<AzkarStackParamList, 'AzkarCategory'>;

function AzkarCard({
	item,
	isDark,
	arabicFamily,
}: {
	item: AzkarItem;
	isDark: boolean;
	arabicFamily: string | undefined;
}) {
	const c = getAppColors(isDark);
	const [current, setCurrent] = useState(0);
	const target = item.count;
	const done = current >= target;
	const cardBorder = isDark
		? 'rgba(255,255,255,0.08)'
		: 'rgba(44,62,80,0.08)';

	const onPress = useCallback(() => {
		if (done) return;
		const next = current + 1;
		setCurrent(next);
		if (next >= target) {
			Haptics.notificationAsync(
				Haptics.NotificationFeedbackType.Success,
			).catch(() => undefined);
		} else {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
				() => undefined,
			);
		}
	}, [current, done, target]);

	const onReset = useCallback(() => {
		setCurrent(0);
		Haptics.selectionAsync().catch(() => undefined);
	}, []);

	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: c.surface,
					borderColor: done ? `${c.accent}55` : cardBorder,
				},
			]}
		>
			{target > 1 ? (
				<View style={styles.cardTop}>
					<Pressable
						onPress={onPress}
						disabled={done}
						style={[
							styles.counter,
							{
								backgroundColor: done
									? `${c.accent}22`
									: `${c.accent}12`,
								borderColor: done ? c.accent : `${c.accent}44`,
							},
						]}
					>
						<Text
							style={[
								styles.counterValue,
								{ color: done ? c.accent : c.text },
							]}
						>
							{done ? ar.azkarCompleted : `${current}/${target}`}
						</Text>
						{!done ? (
							<Text
								style={[
									styles.counterHint,
									{ color: c.textSecondary },
								]}
							>
								{ar.azkarTapToCount}
							</Text>
						) : null}
					</Pressable>
					{current > 0 ? (
						<Pressable onPress={onReset} hitSlop={8}>
							<Text
								style={[styles.reset, { color: c.accentMuted }]}
							>
								{ar.azkarReset}
							</Text>
						</Pressable>
					) : null}
				</View>
			) : null}

			<Text
				style={[
					styles.zekr,
					{
						color: c.arabic,
						fontFamily: arabicFamily,
					},
				]}
			>
				{item.text}
			</Text>

			{item.description ? (
				<View
					style={[
						styles.section,
						{ backgroundColor: `${c.accentMuted}10` },
					]}
				>
					<Text
						style={[styles.sectionLabel, { color: c.accentMuted }]}
					>
						{ar.azkarVirtue}
					</Text>
					<Text
						style={[styles.description, { color: c.textSecondary }]}
					>
						{item.description}
					</Text>
				</View>
			) : null}

			{item.reference ? (
				<View style={styles.referenceRow}>
					<MaterialCommunityIcons
						name='book-open-variant'
						size={14}
						color={c.accent}
					/>
					<Text
						style={[styles.reference, { color: c.textSecondary }]}
					>
						{item.reference}
					</Text>
				</View>
			) : null}
		</View>
	);
}

export function AzkarCategoryScreen({ navigation, route }: Props) {
	const { category } = route.params;
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);
	const arabicFamily = getQuranFontFamily();

	const [items, setItems] = useState<AzkarItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const list = await loadAzkarByCategory(category);
				if (!cancelled) setItems(list);
			} catch {
				if (!cancelled) setError(ar.azkarLoadError);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [category]);

	const renderItem = useCallback(
		({ item }: { item: AzkarItem }) => (
			<AzkarCard
				item={item}
				isDark={isDark}
				arabicFamily={arabicFamily}
			/>
		),
		[arabicFamily, isDark],
	);

	const listHeader = useMemo(
		() => (
			<View style={styles.listHeader}>
				<View
					style={[styles.pill, { backgroundColor: `${c.accent}18` }]}
				>
					<Text style={[styles.pillText, { color: c.accent }]}>
						{ar.azkarItems(items.length)}
					</Text>
				</View>
			</View>
		),
		[c.accent, items.length],
	);

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
					title={category}
					titleStyle={{
						color: c.text,
						fontSize: 17,
						fontWeight: '600',
						textAlign: 'center',
						writingDirection: 'rtl',
					}}
				/>
				<View style={{ width: 48 }} />
			</Appbar.Header>

			{loading ? (
				<View style={styles.center}>
					<Text style={{ color: c.textSecondary }}>{ar.loading}</Text>
				</View>
			) : error ? (
				<EmptyState
					isDark={isDark}
					title={ar.somethingWrong}
					message={error}
				/>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => String(item.id)}
					renderItem={renderItem}
					ListHeaderComponent={listHeader}
					contentContainerStyle={styles.listContent}
					ItemSeparatorComponent={() => (
						<View style={styles.separator} />
					)}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	appBar: { direction: 'ltr' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	listHeader: {
		alignItems: 'flex-end',
		marginBottom: sp.sm,
	},
	pill: {
		paddingHorizontal: sp.md,
		paddingVertical: 6,
		borderRadius: 999,
	},
	pillText: {
		fontSize: 12,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	listContent: {
		paddingHorizontal: sp.lg,
		paddingBottom: sp.xxl,
	},
	separator: { height: sp.md },
	card: {
		borderRadius: 18,
		borderWidth: 1,
		padding: sp.lg,
		gap: sp.md,
	},
	cardTop: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: sp.sm,
	},
	counter: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 14,
		paddingVertical: sp.sm,
		paddingHorizontal: sp.md,
		alignItems: 'center',
		gap: 2,
	},
	counterValue: {
		fontSize: 18,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	counterHint: {
		fontSize: 11,
		writingDirection: 'rtl',
	},
	reset: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	zekr: {
		fontSize: 22,
		lineHeight: 40,
		writingDirection: 'rtl',
	},
	section: {
		borderRadius: 12,
		padding: sp.md,
		gap: sp.xs,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	description: {
		fontSize: 14,
		lineHeight: 22,
		writingDirection: 'rtl',
	},
	referenceRow: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.xs,
	},
	reference: {
		flex: 1,
		fontSize: 12,
		writingDirection: 'rtl',
	},
});

