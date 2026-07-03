import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ar } from '@/i18n/ar';
import { AzkarScreen } from '@/screens/AzkarScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SurahDetailScreen } from '@/screens/SurahDetailScreen';
import { SurahListScreen } from '@/screens/SurahListScreen';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppColors } from '@/utils/theme';

import type { RootTabParamList, SurahsStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SurahsStack = createNativeStackNavigator<SurahsStackParamList>();

const TAB_ICON_SIZE = 20;

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

export function AppNavigator() {
	const isDark = useSettingsStore((s) => s.theme) === 'dark';
	const c = getAppColors(isDark);

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: c.accent,
				tabBarInactiveTintColor: c.textSecondary,
				tabBarStyle: {
					height: 48,
					paddingTop: 2,
					paddingBottom: 2,
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
				component={AzkarScreen}
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
				name='Settings'
				component={SettingsScreen}
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
	);
}

