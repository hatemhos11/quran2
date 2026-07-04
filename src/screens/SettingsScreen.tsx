import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import Constants from 'expo-constants';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Switch, Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ar } from '@/i18n/ar';
import type { SettingsStackParamList } from '@/navigation/types';
import { useReciterStore } from '@/store/reciterStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ReadingFontId, ThemeMode } from '@/types';
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from '@/utils/constants';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

export function SettingsScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
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
	const readingFont = useSettingsStore((s) => s.readingFont);
	const setReadingFont = useSettingsStore((s) => s.setReadingFont);
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

	return (
		<SafeAreaView
			style={[styles.root, { backgroundColor: c.background }]}
			edges={['top']}
		>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={{
					paddingBottom: insets.bottom + sp.xxl,
				}}
			>
				<List.Section>
					<List.Subheader style={{ color: c.textSecondary }}>
						{ar.reading}
					</List.Subheader>
					<View style={styles.pad}>
						<Text variant='titleSmall' style={{ color: c.text }}>
							{ar.arabicSize(fontSize)}
						</Text>
						<Slider
							minimumValue={FONT_SIZE_MIN}
							maximumValue={FONT_SIZE_MAX}
							step={1}
							value={fontSize}
							onValueChange={setFontSize}
							minimumTrackTintColor={c.accent}
							maximumTrackTintColor={c.textSecondary}
							thumbTintColor={c.accent}
							accessibilityLabel={ar.arabicSize(fontSize)}
						/>
						<Text
							style={{
								fontSize,
								lineHeight: fontSize * 2.2,
								color: c.arabic,
								textAlign: 'center',
								marginTop: sp.sm,
								fontFamily:
									readingFont === 'amiri'
										? 'Amiri_400Regular'
										: readingFont === 'scheherazade'
											? 'ScheherazadeNew_400Regular'
											: undefined,
							}}
						>
							{previewArabic}
						</Text>
					</View>
					<Divider />
					<List.Item
						title={ar.transliterationTitle}
						description={ar.transliterationDesc}
						titleStyle={{ color: c.text }}
						descriptionStyle={{ color: c.textSecondary }}
						right={() => (
							<Switch
								value={showTransliteration}
								onValueChange={setShowTransliteration}
								accessibilityLabel={ar.transliterationTitle}
							/>
						)}
					/>
					<Divider />
					<List.Subheader style={{ color: c.textSecondary }}>
						{ar.arabicFont}
					</List.Subheader>
					{(
						['amiri', 'scheherazade', 'system'] as ReadingFontId[]
					).map((id) => (
						<List.Item
							key={id}
							title={
								id === 'amiri'
									? ar.fontAmiri
									: id === 'scheherazade'
										? ar.fontScheherazade
										: ar.fontSystem
							}
							titleStyle={{ color: c.text }}
							onPress={() => setReadingFont(id)}
							right={() =>
								readingFont === id ? (
									<List.Icon icon='check' color={c.accent} />
								) : null
							}
						/>
					))}
				</List.Section>

				<List.Section>
					<List.Subheader style={{ color: c.textSecondary }}>
						{ar.recitation}
					</List.Subheader>
					<List.Item
						title={ar.defaultReciter}
						description={reciterLabel}
						titleStyle={{ color: c.text }}
						descriptionStyle={{
							color: c.textSecondary,
							writingDirection: 'rtl',
						}}
						onPress={() => navigation.navigate('ReciterPicker')}
						right={(props) => (
							<List.Icon {...props} icon='chevron-left' />
						)}
					/>
				</List.Section>

				<List.Section>
					<List.Subheader style={{ color: c.textSecondary }}>
						{ar.appearance}
					</List.Subheader>
					{(['light', 'dark'] as ThemeMode[]).map((m) => (
						<List.Item
							key={m}
							title={m === 'light' ? ar.light : ar.dark}
							titleStyle={{ color: c.text }}
							onPress={() => setTheme(m)}
							right={() =>
								theme === m ? (
									<List.Icon icon='check' color={c.accent} />
								) : null
							}
						/>
					))}
				</List.Section>

				<List.Section>
					<List.Subheader style={{ color: c.textSecondary }}>
						{ar.about}
					</List.Subheader>
					<List.Item
						title={ar.appName}
						description={ar.aboutDesc(dayjs().format('YYYY'))}
						titleStyle={{ color: c.text }}
						descriptionStyle={{ color: c.textSecondary }}
					/>
					{Constants.expoConfig?.version ? (
						<List.Item
							title={ar.version}
							description={Constants.expoConfig.version}
							titleStyle={{ color: c.text }}
							descriptionStyle={{ color: c.textSecondary }}
						/>
					) : null}
				</List.Section>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	scroll: { flex: 1 },
	pad: { paddingHorizontal: sp.lg, paddingVertical: sp.sm },
});

