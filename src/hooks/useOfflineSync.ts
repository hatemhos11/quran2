import { useEffect } from 'react';

import { useQuranStore } from '@/store/quranStore';

import { useNetworkStatus } from './useNetworkStatus';

/** Keeps `quranStore.isOffline` aligned with network state. */
export function useOfflineSync() {
  const { isInternetReachable } = useNetworkStatus();
  const setOffline = useQuranStore((s) => s.setOffline);

  useEffect(() => {
    setOffline(!isInternetReachable);
  }, [isInternetReachable, setOffline]);
}
