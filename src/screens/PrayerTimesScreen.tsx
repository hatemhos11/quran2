import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import React, { useMemo } from 'react';
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { ar } from '@/i18n/ar';
import { openLocationSettings } from '@/services/prayerTimes';
import type { PrayerName } from '@/services/prayerTimes';
import { useSettingsStore } from '@/store/settingsStore';
import { formatCountdown, formatPrayerClock } from '@/utils/formatPrayerTime';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

dayjs.locale('ar');

const PRAYER_ICONS: Record<
	PrayerName,
	keyof typeof MaterialCommunityIcons.glyphMap
> = {
	fajr: 'weather-night',
	sunrise: 'weather-sunset-up',
	dhuhr: 'white-balance-sunny',
	asr: 'weather-partly-cloudy',
	maghrib: 'weather-sunset',
	isha: 'moon-waning-crescent',
};

function prayerLabel(id: PrayerName): string {
	switch (id) {
		case 'fajr':
			return ar.prayerFajr;
		case 'sunrise':
			return ar.prayerSunrise;
		case 'dhuhr':
			return ar.prayerDhuhr;
		case 'asr':
			return ar.prayerAsr;
		case 'maghrib':
			return ar.prayerMaghrib;
		case 'isha':
			return ar.prayerIsha;
	}
}

export function PrayerTimesScreen() {
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);
	const cardBorder = isDark
		? 'rgba(255,255,255,0.08)'
		: 'rgba(44,62,80,0.08)';

	const {
		location,
		loading,
		refreshing,
		permissionDenied,
		now,
		slots,
		currentPrayer,
		nextPrayer,
		countdownMs,
		usingDefaultLocation,
		refresh,
	} = usePrayerTimes();

	const dateLabel = useMemo(
		() => dayjs(now).format('dddd، D MMMM YYYY'),
		[now],
	);

	if (loading && !location) {
		return (
			<SafeAreaView
				style={[styles.root, { backgroundColor: c.background }]}
				edges={['top']}
			>
				<View style={styles.loader}>
					<ActivityIndicator size='large' color={c.accent} />
					<Text style={[styles.loaderText, { color: c.textSecondary }]}>
						{ar.prayerLoading}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						tintColor={c.accent}
					/>
				}
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: c.text }]}>
						{ar.prayerTimes}
					</Text>
					<Text style={[styles.date, { color: c.textSecondary }]}>
						{dateLabel}
					</Text>
				</View>

				<Pressable
					onPress={refresh}
					style={({ pressed }) => [
						styles.locationChip,
						{
							backgroundColor: c.surface,
							borderColor: cardBorder,
							opacity: pressed ? 0.9 : 1,
						},
					]}
					accessibilityRole='button'
					accessibilityLabel={ar.prayerUpdateLocation}
				>
					<MaterialCommunityIcons
						name='map-marker-outline'
						size={18}
						color={c.accent}
					/>
					<Text
						style={[styles.locationText, { color: c.text }]}
						numberOfLines={1}
					>
						{location?.label ?? DEFAULT_FALLBACK_LABEL}
					</Text>
					<MaterialCommunityIcons
						name='refresh'
						size={18}
						color={c.textSecondary}
					/>
				</Pressable>

				{permissionDenied || usingDefaultLocation ? (
					<View
						style={[
							styles.permissionBanner,
							{
								backgroundColor: c.accentSoft,
								borderColor: `${c.accent}44`,
							},
						]}
					>
						<MaterialCommunityIcons
							name='map-marker-off-outline'
							size={20}
							color={c.accent}
						/>
						<Text
							style={[styles.permissionText, { color: c.text }]}
						>
							{permissionDenied
								? ar.prayerPermissionDenied
								: ar.prayerDefaultLocationHint}
						</Text>
						<View style={styles.permissionActions}>
							<Pressable
								onPress={refresh}
								style={({ pressed }) => [
									styles.permissionBtn,
									{
										backgroundColor: c.accent,
										opacity: pressed ? 0.88 : 1,
									},
								]}
							>
								<Text style={styles.permissionBtnText}>
									{ar.prayerUseMyLocation}
								</Text>
							</Pressable>
							{permissionDenied ? (
								<Pressable
									onPress={() => void openLocationSettings()}
									style={({ pressed }) => [
										styles.permissionBtnOutline,
										{
											borderColor: c.accent,
											opacity: pressed ? 0.88 : 1,
										},
									]}
								>
									<Text
										style={[
											styles.permissionBtnOutlineText,
											{ color: c.accent },
										]}
									>
										{ar.prayerOpenSettings}
									</Text>
								</Pressable>
							) : null}
						</View>
					</View>
				) : null}

				{nextPrayer ? (
					<View
						style={[
							styles.hero,
							{
								backgroundColor: c.accent,
								shadowColor: c.cardShadow,
							},
						]}
					>
						<Text style={styles.heroLabel}>{ar.prayerNext}</Text>
						<Text style={styles.heroName}>
							{prayerLabel(nextPrayer.id)}
						</Text>
						<Text style={styles.heroCountdown}>
							{formatCountdown(countdownMs)}
						</Text>
						<View style={styles.heroFooter}>
							<Text style={styles.heroTime}>
								{formatPrayerClock(nextPrayer.time)}
							</Text>
							<MaterialCommunityIcons
								name={PRAYER_ICONS[nextPrayer.id]}
								size={28}
								color='rgba(255,255,255,0.9)'
							/>
						</View>
					</View>
				) : null}

				<Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
					{ar.prayerToday}
				</Text>

				<View style={styles.list}>
					{slots.map((slot) => {
						const isNext = nextPrayer?.id === slot.id;
						const isCurrent = currentPrayer === slot.id;
						const isActive = isNext || isCurrent;
						const passed = slot.time.getTime() < now.getTime();

						return (
							<View
								key={slot.id}
								style={[
									styles.row,
									{
										backgroundColor: isActive
											? c.accentSoft
											: c.surface,
										borderColor: isActive
											? `${c.accent}55`
											: cardBorder,
									},
								]}
							>
								<View
									style={[
										styles.iconWrap,
										{
											backgroundColor: isActive
												? `${c.accent}22`
												: c.surfaceMuted,
										},
									]}
								>
									<MaterialCommunityIcons
										name={PRAYER_ICONS[slot.id]}
										size={22}
										color={
											isActive ? c.accent : c.textSecondary
										}
									/>
								</View>

								<View style={styles.rowBody}>
									<Text
										style={[
											styles.rowTitle,
											{
												color: isActive
													? c.accent
													: c.text,
											},
										]}
									>
										{prayerLabel(slot.id)}
									</Text>
									{isNext ? (
										<Text
											style={[
												styles.rowMeta,
												{ color: c.accent },
											]}
										>
											{ar.prayerNext}
										</Text>
									) : isCurrent ? (
										<Text
											style={[
												styles.rowMeta,
												{ color: c.textSecondary },
											]}
										>
											{ar.prayerCurrent}
										</Text>
									) : passed ? (
										<Text
											style={[
												styles.rowMeta,
												{ color: c.textTertiary },
											]}
										>
											{ar.prayerPassed}
										</Text>
									) : null}
								</View>

								<Text
									style={[
										styles.rowTime,
										{
											color: isActive
												? c.accent
												: passed
													? c.textTertiary
													: c.text,
										},
									]}
								>
									{formatPrayerClock(slot.time)}
								</Text>
							</View>
						);
					})}
				</View>

				<View
					style={[
						styles.noteCard,
						{
							backgroundColor: c.surface,
							borderColor: cardBorder,
						},
					]}
				>
					<MaterialCommunityIcons
						name='information-outline'
						size={18}
						color={c.textSecondary}
					/>
					<Text style={[styles.noteText, { color: c.textSecondary }]}>
						{ar.prayerMethodNote}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const DEFAULT_FALLBACK_LABEL = '—';

const styles = StyleSheet.create({
	root: { flex: 1 },
	scroll: { flex: 1 },
	content: {
		paddingHorizontal: sp.lg,
		paddingBottom: sp.xxl * 2,
		gap: sp.md,
	},
	loader: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: sp.md,
	},
	loaderText: {
		fontSize: 14,
		writingDirection: 'rtl',
	},
	header: {
		paddingTop: sp.sm,
		gap: sp.xs,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		writingDirection: 'rtl',
	},
	date: {
		fontSize: 14,
		writingDirection: 'rtl',
	},
	locationChip: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.sm,
		alignSelf: 'flex-start',
		maxWidth: '100%',
		borderRadius: 999,
		borderWidth: 1,
		paddingVertical: sp.sm,
		paddingHorizontal: sp.lg,
	},
	locationText: {
		flexShrink: 1,
		fontSize: 14,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	hint: {
		fontSize: 12,
		writingDirection: 'rtl',
		lineHeight: 18,
		marginTop: -sp.xs,
	},
	permissionBanner: {
		borderRadius: 16,
		borderWidth: 1,
		padding: sp.lg,
		gap: sp.md,
	},
	permissionText: {
		fontSize: 13,
		lineHeight: 20,
		writingDirection: 'rtl',
	},
	permissionActions: {
		flexDirection: 'row-reverse',
		flexWrap: 'wrap',
		gap: sp.sm,
	},
	permissionBtn: {
		borderRadius: 10,
		paddingVertical: sp.sm,
		paddingHorizontal: sp.lg,
	},
	permissionBtnText: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	permissionBtnOutline: {
		borderRadius: 10,
		borderWidth: 1,
		paddingVertical: sp.sm,
		paddingHorizontal: sp.lg,
	},
	permissionBtnOutlineText: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	hero: {
		borderRadius: 20,
		padding: sp.xl,
		gap: sp.xs,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 16,
		elevation: 4,
	},
	heroLabel: {
		color: 'rgba(255,255,255,0.82)',
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	heroName: {
		color: '#FFFFFF',
		fontSize: 32,
		fontWeight: '800',
		writingDirection: 'rtl',
	},
	heroCountdown: {
		color: '#FFFFFF',
		fontSize: 40,
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
		marginTop: sp.xs,
	},
	heroFooter: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: sp.sm,
	},
	heroTime: {
		color: 'rgba(255,255,255,0.92)',
		fontSize: 16,
		fontWeight: '600',
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: '600',
		writingDirection: 'rtl',
		marginTop: sp.xs,
	},
	list: {
		gap: sp.sm,
	},
	row: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.md,
		borderRadius: 16,
		borderWidth: 1,
		padding: sp.lg,
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	rowBody: {
		flex: 1,
		gap: 2,
	},
	rowTitle: {
		fontSize: 16,
		fontWeight: '600',
		writingDirection: 'rtl',
	},
	rowMeta: {
		fontSize: 12,
		writingDirection: 'rtl',
	},
	rowTime: {
		fontSize: 16,
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
	},
	noteCard: {
		flexDirection: 'row-reverse',
		alignItems: 'flex-start',
		gap: sp.sm,
		borderRadius: 14,
		borderWidth: 1,
		padding: sp.lg,
		marginTop: sp.sm,
	},
	noteText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 18,
		writingDirection: 'rtl',
	},
});
