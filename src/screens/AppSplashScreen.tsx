import { getAppColors } from '@/utils/theme';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { hideNativeSplash } from '@/hooks/useAppBootstrap';
import { useSettingsStore } from '@/store/settingsStore';

const { width } = Dimensions.get('window');

type Props = {
  appName?: string;
  arabicTitle?: string;
};

export function AppSplashScreen({
  appName = 'القرآن',
  arabicTitle = 'ٱلْقُرْآن',
}: Props) {
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const c = getAppColors(isDark);

  useEffect(() => {
    hideNativeSplash();
  }, []);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
		Animated.parallel([
			Animated.timing(fade, {
				toValue: 1,
				duration: 700,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.spring(scale, {
				toValue: 1,
				friction: 7,
				tension: 60,
				useNativeDriver: true,
			}),
		]).start();

		Animated.loop(
			Animated.timing(shimmer, {
				toValue: 1,
				duration: 2400,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true,
			}),
		).start();
	}, [fade, scale, shimmer]);

	const shimmerOpacity = shimmer.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [0.35, 0.9, 0.35],
	});

	return (
		<View style={[styles.root, { backgroundColor: c.background }]}>
			{/* Soft radial glow */}
			<View
				style={[
					styles.glow,
					{ backgroundColor: c.accentSoft, shadowColor: c.accent },
				]}
			/>

			<Animated.View
				style={[
					styles.center,
					{ opacity: fade, transform: [{ scale }] },
				]}
			>
				{/* Emblem */}
				<View
					style={[
						styles.emblem,
						{
							backgroundColor: c.surfaceElevated,
							borderColor: c.border,
							shadowColor: c.cardShadow,
						},
					]}
				>
					<View
						style={[
							styles.emblemInner,
							{ borderColor: c.accentMuted },
						]}
					>
						<Text style={[styles.arabic, { color: c.arabic }]}>
							{arabicTitle}
						</Text>
					</View>
					<Animated.View
						pointerEvents='none'
						style={[
							styles.ring,
							{ borderColor: c.accent, opacity: shimmerOpacity },
						]}
					/>
				</View>

				<Text style={[styles.title, { color: c.text }]}>{appName}</Text>
				<View style={[styles.rule, { backgroundColor: c.accentMuted }]} />
			</Animated.View>

			{/* Footer basmala */}
			<Animated.Text
				style={[
					styles.footer,
					{ color: c.textTertiary, opacity: fade },
				]}
			>
				بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
			</Animated.Text>
		</View>
	);
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

