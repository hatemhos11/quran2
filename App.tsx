import 'react-native-get-random-values';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';

import { configureRtlLayout, reloadAppForRtl } from '@/i18n/rtl';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppSplashScreen } from '@/screens/AppSplashScreen';
import { useQuranStore } from '@/store/quranStore';
import { useSettingsStore } from '@/store/settingsStore';
import { buildNavigationTheme, buildPaperTheme } from '@/utils/theme';

function AppShell() {
  const themeMode = useSettingsStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const paperTheme = useMemo(() => buildPaperTheme(isDark), [isDark]);
  const navTheme = useMemo(() => buildNavigationTheme(isDark), [isDark]);

  useEffect(() => {
    void useQuranStore.getState().loadSurahs();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, direction: 'rtl' }}>
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
  const isReady = useAppBootstrap();

  useEffect(() => {
    const needsReload = configureRtlLayout();
    if (needsReload) reloadAppForRtl();
  }, []);

  if (!isReady) {
    return <AppSplashScreen />;
  }

  return <AppShell />;
}
