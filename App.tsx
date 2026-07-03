import 'react-native-get-random-values';

import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';
import { useFonts } from 'expo-font';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';

import { AppNavigator } from '@/navigation/AppNavigator';
import { seedQuranDb } from '@/db/seedFromJson';
import { initOfflineDb } from '@/services/offlineStorage';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import { buildNavigationTheme, buildPaperTheme } from '@/utils/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const themeMode = useSettingsStore((s) => s.theme);
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    ScheherazadeNew_400Regular,
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initOfflineDb();
        await seedQuranDb();
      } finally {
        if (!cancelled) setDbReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dbReady) {
      void useQuranStore.getState().loadSurahs();
    }
  }, [dbReady]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && dbReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  const isDark = themeMode === 'dark';
  const paperTheme = useMemo(() => buildPaperTheme(isDark), [isDark]);
  const navTheme = useMemo(() => buildNavigationTheme(isDark), [isDark]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, direction: 'rtl' }}
      onLayout={onLayoutRootView}>
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
