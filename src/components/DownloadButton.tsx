import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
	isDark: boolean;
	isOnline: boolean;
	isDownloaded: boolean;
	progress: number | null;
	busy: boolean;
	onDownload: () => void;
	onDelete: () => void;
};

export function DownloadButton({
	isDark,
	isOnline,
	isDownloaded,
	progress,
	busy,
	onDownload,
	onDelete,
}: Props) {
	const c = getAppColors(isDark);

	if (isDownloaded) {
		return (
			<View style={styles.row}>
				{/* <View
					style={[styles.badge, { backgroundColor: `${c.accent}22` }]}
				>
					<MaterialCommunityIcons
						name='check-circle'
						size={18}
						color={c.accent}
					/>
					<Text variant='labelLarge' style={{ color: c.accent }}>
						{ar.offlineSaved}
					</Text>
				</View> */}
				{/* <Button mode="outlined" onPress={onDelete} disabled={busy} textColor={c.text}>
          {ar.removeDownload}
        </Button> */}
			</View>
		);
	}

	return (
		<View style={styles.col}>
			<Button
				mode='contained-tonal'
				onPress={onDownload}
				disabled={!isOnline || busy}
				icon='download'
				contentStyle={styles.btnContent}
				accessibilityLabel={ar.downloadSurah}
			>
				{busy && progress !== null
					? ar.downloadingPct(progress)
					: ar.downloadSurah}
			</Button>
			{!isOnline ? (
				<Text
					variant='bodySmall'
					style={{ color: c.textSecondary, textAlign: 'center' }}
				>
					{ar.connectToDownload}
				</Text>
			) : null}
			{busy && progress !== null ? (
				<ProgressBar
					progress={progress / 100}
					style={styles.bar}
					color={c.accent}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		paddingHorizontal: sp.lg,
		gap: sp.md,
		alignItems: 'center',
	},
	col: {
		paddingHorizontal: sp.lg,
		gap: sp.sm,
	},
	btnContent: { minHeight: 40 },
	bar: { height: 6, borderRadius: 3, marginTop: sp.xs },
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: sp.sm,
		paddingHorizontal: sp.md,
		paddingVertical: sp.sm,
		borderRadius: sp.md,
	},
});

