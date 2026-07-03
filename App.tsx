import 'react-native-get-random-values';

import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';
import { useFonts } from 'expo-font';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';

import { AppNavigator } from '@/navigation/AppNavigator';
import { initBundledDb } from '@/services/offlineStorage';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import { buildNavigationTheme, buildPaperTheme } from '@/utils/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell({ onLayout }: { onLayout: () => void }) {
  const themeMode = useSettingsStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const paperTheme = useMemo(() => buildPaperTheme(isDark), [isDark]);
  const navTheme = useMemo(() => buildNavigationTheme(isDark), [isDark]);

  useEffect(() => {
    void useQuranStore.getState().loadSurahs();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, direction: 'rtl' }} onLayout={onLayout}>
      <PaperProvider theme={paperTheme}>
        <BottomSheetModalProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <AppNavigator />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    ScheherazadeNew_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SQLiteProvider
      databaseName="quran_reader.db"
      assetSource={{ assetId: require('./assets/quran_reader.db') }}
      onInit={initBundledDb}
    >
      <AppShell onLayout={onLayoutRootView} />
    </SQLiteProvider>
  );
}
