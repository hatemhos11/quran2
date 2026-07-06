import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import React, {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ActivityIndicator, Share, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';

import * as Haptics from 'expo-haptics';

import { ar } from '@/i18n/ar';
import { loadTafsirOffline } from '@/services/offlineStorage';
import { getQuranFontFamily } from '@/services/fontLoader';
import type { Ayah } from '@/types';
import { MUYASSAR_TAFSIR_ID } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { parseTafsirHtml, stripTafsirHtml } from '@/utils/tafsirText';
import { getAppColors } from '@/utils/theme';

export type TafsirSheetRef = BottomSheetModal;

type Props = {
	isDark: boolean;
	surahNumber: number;
	surahEnglishName: string;
	ayah: Ayah | null;
	ayahIsPinned: boolean;
	onTogglePin: () => void;
	onDismiss: () => void;
};

export const TafsirBottomSheet = forwardRef<BottomSheetModal, Props>(
	function TafsirBottomSheet(
		{
			isDark,
			surahNumber,
			surahEnglishName,
			ayah,
			ayahIsPinned,
			onTogglePin,
			onDismiss,
		},
		ref,
	) {
		const c = getAppColors(isDark);
		const quranFont = getQuranFontFamily();
		const [body, setBody] = useState('');
		const [loading, setLoading] = useState(false);

		const onPressPin = useCallback(() => {
			onTogglePin();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
				() => undefined,
			);
		}, [onTogglePin]);

		useEffect(() => {
			let cancelled = false;
			(async () => {
				if (!ayah) {
					setBody('');
					return;
				}
				setLoading(true);
				setBody('');
				try {
					const local = await loadTafsirOffline(
						surahNumber,
						ayah.numberInSurah,
						MUYASSAR_TAFSIR_ID,
					);
					if (!cancelled) setBody(local || ar.noTafsir);
				} catch {
					if (!cancelled) setBody(ar.tafsirLoadError);
				} finally {
					if (!cancelled) setLoading(false);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [ayah, surahNumber]);

		const backdrop = useCallback(
			(props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
				<BottomSheetBackdrop
					{...props}
					disappearsOnIndex={-1}
					appearsOnIndex={0}
					opacity={0.55}
				/>
			),
			[],
		);

		const snapPoints = useMemo(() => ['52%', '92%'], []);
		const tafsirSegments = useMemo(() => parseTafsirHtml(body), [body]);
		const plainBody = useMemo(() => stripTafsirHtml(body), [body]);

		const onCopy = async () => {
			if (!ayah) return;
			await Clipboard.setStringAsync(`${ayah.text}\n\n${plainBody}`);
			Haptics.selectionAsync().catch(() => undefined);
		};

		const onShare = async () => {
			if (!ayah) return;
			await Share.share({
				message: `${ayah.text}\n\n— ${surahEnglishName} ${surahNumber}:${ayah.numberInSurah}\n\n${plainBody}`,
			});
		};

		const ayahRef = ayah
			? `${surahEnglishName} · ${surahNumber}:${ayah.numberInSurah}`
			: '';

		return (
			<BottomSheetModal
				ref={ref}
				index={0}
				snapPoints={snapPoints}
				enablePanDownToClose
				backdropComponent={backdrop}
				onDismiss={onDismiss}
				handleIndicatorStyle={{
					backgroundColor: c.textTertiary ?? c.textSecondary,
					width: 44,
					height: 5,
					borderRadius: 3,
				}}
				backgroundStyle={{
					backgroundColor: c.surfaceElevated ?? c.surface,
					borderTopLeftRadius: 28,
					borderTopRightRadius: 28,
				}}
			>
				<BottomSheetScrollView
					contentContainerStyle={styles.sheetPad}
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.sheetHeader}>
						<View style={{ flex: 1 }}>
							<Text
								variant='titleMedium'
								style={{
									color: c.text,
									writingDirection: 'rtl',
									fontWeight: '700',
								}}
							>
								{ar.tafsirMuyassarTitle}
							</Text>
							{ayahRef ? (
								<Text
									style={{
										color: c.textSecondary,
										fontSize: 12,
										marginTop: 2,
										writingDirection: 'rtl',
									}}
								>
									{ayahRef}
								</Text>
							) : null}
						</View>
						{ayah ? (
							<IconButton
								icon={ayahIsPinned ? 'pin' : 'pin-outline'}
								onPress={onPressPin}
								size={20}
								mode='contained-tonal'
								containerColor={
									ayahIsPinned
										? (c.accentMuted ?? c.surfaceMuted)
										: c.surfaceMuted
								}
								iconColor={
									ayahIsPinned ? c.accent : c.textSecondary
								}
								accessibilityLabel={
									ayahIsPinned
										? ar.unpinAyahA11y
										: ar.pinAyahA11y
								}
							/>
						) : null}
					</View>

					{ayah ? (
						<>
							{/* Ayah card with accent bar */}
							<View
								style={[
									styles.ayahCard,
									{
										backgroundColor: isDark
											? 'rgba(255,255,255,0.04)'
											: c.surfaceMuted,
										borderColor: isDark
											? 'rgba(255,255,255,0.06)'
											: c.border,
									},
								]}
							>
								<View
									style={[
										styles.accentBar,
										{ backgroundColor: c.accent },
									]}
								/>
								<Text
									style={[
										styles.ayahText,
										{ color: c.arabic, fontFamily: quranFont },
									]}
								>
									{ayah.text}
								</Text>
							</View>

							{/* Tafsir body */}
							{loading ? (
								<View style={styles.loadingWrap}>
									<ActivityIndicator color={c.accent} />
								</View>
							) : (
								<Text
									variant='bodyLarge'
									style={[
										styles.tafsirBody,
										{
											color: c.text,
											writingDirection: 'rtl',
											fontFamily: quranFont,
										},
									]}
								>
									{tafsirSegments.length > 0
										? tafsirSegments.map((seg, i) => (
												<Text
													key={i}
													style={
														seg.highlight ===
														'green'
															? {
																	color: c.accent,
																	fontWeight:
																		'700',
																}
															: seg.highlight ===
																  'blue'
																? {
																		color: c.accentMuted,
																		fontWeight:
																			'700',
																	}
																: undefined
													}
												>
													{seg.text}
												</Text>
											))
										: '—'}
								</Text>
							)}

							{/* Divider */}
							<View
								style={[
									styles.divider,
									{ backgroundColor: c.border },
								]}
							/>

							{/* Actions */}
							<View style={styles.actions}>
								<Button
									mode='contained'
									onPress={onCopy}
									icon='content-copy'
									style={styles.actionBtn}
									contentStyle={styles.actionBtnContent}
									buttonColor={c.accent}
									textColor={c.surface}
								>
									{ar.copy}
								</Button>
								<Button
									mode='outlined'
									onPress={onShare}
									icon='share-variant'
									style={styles.actionBtn}
									contentStyle={styles.actionBtnContent}
									textColor={c.text}
								>
									{ar.share}
								</Button>
							</View>
						</>
					) : (
						<View style={styles.emptyWrap}>
							<Text
								style={{
									color: c.textSecondary,
									writingDirection: 'rtl',
									textAlign: 'center',
								}}
							>
								{ar.selectAyah}
							</Text>
						</View>
					)}
				</BottomSheetScrollView>
			</BottomSheetModal>
		);
	},
);

TafsirBottomSheet.displayName = 'TafsirBottomSheet';

const styles = StyleSheet.create({
	sheetPad: {
		paddingHorizontal: sp.xl,
		paddingTop: sp.sm,
		paddingBottom: sp.xxl + sp.lg,
	},
	sheetHeader: {
		flexDirection: 'row-reverse',
		alignItems: 'center',
		gap: sp.sm,
		marginBottom: sp.lg,
	},
	ayahCard: {
		flexDirection: 'row',
		borderRadius: 18,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: 'hidden',
		marginBottom: sp.lg,
	},
	accentBar: {
		width: 4,
	},
	ayahText: {
		flex: 1,
		fontSize: 22,
		lineHeight: 40,
		writingDirection: 'rtl',
		padding: sp.lg,
	},
	tafsirBody: {
		fontSize: 16,
		lineHeight: 30,
	},
	loadingWrap: {
		paddingVertical: sp.xl,
		alignItems: 'center',
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		marginTop: sp.xl,
		marginBottom: sp.lg,
		opacity: 0.6,
	},
	actions: {
		flexDirection: 'row',
		gap: sp.md,
	},
	actionBtn: {
		flex: 1,
		borderRadius: 14,
	},
	actionBtnContent: {
		height: 46,
	},
	emptyWrap: {
		paddingVertical: sp.xxl,
		alignItems: 'center',
	},
});

