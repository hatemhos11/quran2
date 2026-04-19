import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetworkStatus(): { isConnected: boolean; isInternetReachable: boolean | null } {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(setState);
    return () => sub();
  }, []);

  const isConnected = !!state?.isConnected;
  const reachable = state?.isInternetReachable;
  const isInternetReachable = reachable === null ? isConnected : !!reachable;

  return { isConnected, isInternetReachable };
}
