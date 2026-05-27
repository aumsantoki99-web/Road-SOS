/**
 * useNetworkStatus — Network connectivity hook
 *
 * Tracks online/offline state using NetInfo subscription.
 *
 * Usage:
 *   const { isConnected, status, lastChecked } = useNetworkStatus();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetworkStatus } from '../types';

interface NetworkStatusResult {
  isConnected: boolean;
  status: NetworkStatus;
  lastChecked: number | null;
  /** Manually re-check now */
  recheck: () => void;
}

export function useNetworkStatus(): NetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const isMounted = useRef(true);

  const check = useCallback(async (): Promise<void> => {
    const state = await NetInfo.fetch();
    if (!isMounted.current) return;
    const connected = Boolean(state.isConnected);
    setStatus(connected ? 'online' : 'offline');
    setLastChecked(Date.now());
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void check();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!isMounted.current) return;
      const connected = Boolean(state.isConnected);
      setStatus(connected ? 'online' : 'offline');
      setLastChecked(Date.now());
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [check]);

  return {
    isConnected: status === 'online',
    status,
    lastChecked,
    recheck: () => void check(),
  };
}
