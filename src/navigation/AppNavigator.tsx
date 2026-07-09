import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlobalAyahAudioPlayer } from '@/components/GlobalAyahAudioPlayer';
import { ar } from '@/i18n/ar';
import { AzkarCategoriesScreen } from '@/screens/AzkarCategoriesScreen';
import { AzkarCategoryScreen } from '@/screens/AzkarCategoryScreen';
import { PrayerTimesScreen } from '@/screens/PrayerTimesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ReciterPickerScreen } from '@/screens/ReciterPickerScreen';
import { SurahDetailScreen } from '@/screens/SurahDetailScreen';
import { SurahListScreen } from '@/screens/SurahListScreen';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppColors } from '@/utils/theme';

import type { AzkarStackParamList, PrayerStackParamList, RootTabParamList, SettingsStackParamList, SurahsStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SurahsStack = createNativeStackNavigator<SurahsStackParamList>();
const AzkarStack = createNativeStackNavigator<AzkarStackParamList>();
const PrayerStack = createNativeStackNavigator<PrayerStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const TAB_ICON_SIZE = 20;
const TAB_BAR_BASE_HEIGHT = 60;

function SurahsStackNavigator() {
	return (
		<SurahsStack.Navigator
			initialRouteName='SurahList'
			screenOptions={{
				headerShown: false,
				animation: 'fade_from_bottom',
			}}
		>
			<SurahsStack.Screen name='SurahList' component={SurahListScreen} />
			<SurahsStack.Screen
				name='SurahDetail'
				component={SurahDetailScreen}
			/>
		</SurahsStack.Navigator>
	);
}

function AzkarStackNavigator() {
	return (
		<AzkarStack.Navigator
			initialRouteName="AzkarCategories"
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<AzkarStack.Screen name="AzkarCategories" component={AzkarCategoriesScreen} />
			<AzkarStack.Screen name="AzkarCategory" component={AzkarCategoryScreen} />
		</AzkarStack.Navigator>
	);
}

function PrayerStackNavigator() {
	return (
		<PrayerStack.Navigator
			initialRouteName='PrayerTimesMain'
			screenOptions={{
				headerShown: false,
				animation: 'fade_from_bottom',
			}}
		>
			<PrayerStack.Screen
				name='PrayerTimesMain'
				component={PrayerTimesScreen}
			/>
		</PrayerStack.Navigator>
	);
}

function SettingsStackNavigator() {
	return (
		<SettingsStack.Navigator
			initialRouteName="SettingsMain"
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
			<SettingsStack.Screen name="ReciterPicker" component={ReciterPickerScreen} />
		</SettingsStack.Navigator>
	);
}

export function AppNavigator() {
	const insets = useSafeAreaInsets();
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);
	const tabBarHeight = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom - 8, 0);

	return (
		<View style={styles.root}>
			<Tab.Navigator
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: c.accent,
					tabBarInactiveTintColor: c.textSecondary,
					tabBarStyle: {
						height: tabBarHeight,
						paddingTop: 8,
						paddingBottom: Math.max(insets.bottom, 8),
						backgroundColor: c.surface,
						borderTopColor: isDark ? '#37474F' : '#E0E0E0',
					},
					tabBarLabelStyle: {
						fontSize: 11,
						marginBottom: 3,
					},
					tabBarIconStyle: {
						marginTop: 1,
					},
				}}
			>
				<Tab.Screen
					name='Surahs'
					component={SurahsStackNavigator}
					options={{
						title: ar.surahs,
						tabBarIcon: ({ color }) => (
							<MaterialCommunityIcons
								name='book-open-page-variant'
								size={TAB_ICON_SIZE}
								color={color}
							/>
						),
					}}
				/>
				<Tab.Screen
					name='Azkar'
					component={AzkarStackNavigator}
					options={{
						title: ar.azkar,
						tabBarIcon: ({ color }) => (
							<MaterialCommunityIcons
								name='hands-pray'
								size={TAB_ICON_SIZE}
								color={color}
							/>
						),
					}}
				/>
				<Tab.Screen
					name='Prayer'
					component={PrayerStackNavigator}
					options={{
						title: ar.prayerTimesTab,
						tabBarIcon: ({ color }) => (
							<MaterialCommunityIcons
								name='mosque'
								size={TAB_ICON_SIZE}
								color={color}
							/>
						),
					}}
				/>
				<Tab.Screen
					name='Settings'
					component={SettingsStackNavigator}
					options={{
						title: ar.settings,
						tabBarIcon: ({ color }) => (
							<MaterialCommunityIcons
								name='cog-outline'
								size={TAB_ICON_SIZE}
								color={color}
							/>
						),
					}}
				/>
			</Tab.Navigator>
			<GlobalAyahAudioPlayer bottomOffset={tabBarHeight} />
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
});

