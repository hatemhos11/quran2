import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ar } from '@/i18n/ar';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SurahDetailScreen } from '@/screens/SurahDetailScreen';
import { SurahListScreen } from '@/screens/SurahListScreen';

import type { MainStackParamList, RootDrawerParamList } from './types';

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function MainStackNavigator() {
	return (
		<Stack.Navigator
			initialRouteName='SurahDetail'
			screenOptions={{
				headerShadowVisible: false,
				animation: 'fade_from_bottom',
			}}
		>
			<Stack.Screen
				name='SurahDetail'
				component={SurahDetailScreen}
				initialParams={{ surahNumber: 1 }}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='Settings'
				component={SettingsScreen}
				options={{
					title: ar.settings,
					headerShown: true,
					headerStyle: { direction: 'ltr' },
					headerTitleStyle: { writingDirection: 'rtl' },
				}}
			/>
		</Stack.Navigator>
	);
}

export function AppNavigator() {
	return (
		<Drawer.Navigator
			drawerContent={(props) => <SurahListScreen {...props} />}
			screenOptions={{
				headerShown: false,
				drawerType: 'front',
				drawerPosition: 'right',
				// LTR drawer: opens from the physical left, standard swipe + layout (avoids RTL drawer bugs).
				drawerStyle: { width: '92%', maxWidth: 360 },
				overlayColor: 'rgba(0,0,0,0.35)',
			}}
		>
			<Drawer.Screen name='Main' component={MainStackNavigator} />
		</Drawer.Navigator>
	);
}

