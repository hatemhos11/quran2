import { getAppColors } from '@/utils/theme';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { hideNativeSplash } from '@/hooks/useAppBootstrap';
import { useSettingsStore } from '@/store/settingsStore';

const { width } = Dimensions.get('window');

type Props = {
	appName?: string;
	arabicTitle?: string;
};

export function AppSplashScreen({}: Props) {
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	useEffect(() => {
		hideNativeSplash();
	}, []);

	return <View style={[styles.root, { backgroundColor: c.background }]} />;
}

const EMBLEM = Math.min(width * 0.44, 180);

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	glow: {
		position: 'absolute',
		width: width * 0.9,
		height: width * 0.9,
		borderRadius: width,
		opacity: 0.55,
		shadowOpacity: 0.35,
		shadowRadius: 60,
		shadowOffset: { width: 0, height: 0 },
	},
	center: { alignItems: 'center' },
	emblem: {
		width: EMBLEM,
		height: EMBLEM,
		borderRadius: EMBLEM / 2,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		shadowOpacity: 1,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 12 },
		elevation: 8,
		marginBottom: 28,
	},
	emblemInner: {
		width: EMBLEM - 24,
		height: EMBLEM - 24,
		borderRadius: (EMBLEM - 24) / 2,
		borderWidth: 1.2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ring: {
		position: 'absolute',
		width: EMBLEM + 18,
		height: EMBLEM + 18,
		borderRadius: (EMBLEM + 18) / 2,
		borderWidth: 1,
	},
	arabic: {
		fontSize: EMBLEM * 0.34,
		fontWeight: '600',
		includeFontPadding: false,
		textAlign: 'center',
	},
	title: {
		fontSize: 30,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	rule: {
		width: 36,
		height: 2,
		borderRadius: 2,
		marginVertical: 12,
		opacity: 0.8,
	},
	footer: {
		position: 'absolute',
		bottom: 40,
		fontSize: 16,
	},
});

