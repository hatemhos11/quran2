import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { openBundledDatabase } from '@/services/offlineStorage';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function hideNativeSplash(): void {
  SplashScreen.hideAsync().catch(() => undefined);
}

export function useAppBootstrap() {
  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
  });
  const [dbReady, setDbReady] = useState(false);

  const isReady = fontsLoaded && dbReady;

  useEffect(() => {
    let cancelled = false;
    openBundledDatabase()
      .then(() => {
        if (!cancelled) setDbReady(true);
      })
      .catch(() => {
        if (!cancelled) setDbReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return isReady;
}
