/**
 * useNetworkStatus — Network connectivity hook
 *
 * Tracks online/offline state. Currently uses a polling approach
 * (fetch a lightweight endpoint) since @react-native-community/netinfo
 * is not in the dependency list for SDK 54 compatibility.
 *
 * TODO: Replace polling with NetInfo for instant detection:
 *   npx expo install @react-native-community/netinfo
 *   import NetInfo from '@react-native-community/netinfo';
 *   NetInfo.addEventListener(state => setIsConnected(state.isConnected));
 *
 * Usage:
 *   const { isConnected, status, lastChecked } = useNetworkStatus();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NetworkStatus } from '../types';

const POLL_INTERVAL_MS  = 15_000; // check every 15 seconds
const CHECK_TIMEOUT_MS  = 5_000;  // timeout per check
// Lightweight endpoint — just checking reachability, not content
const CHECK_URL = 'https://www.gstatic.com/generate_204';

interface NetworkStatusResult {
  isConnected: boolean;
  status: NetworkStatus;
  lastChecked: number | null;
  /** Manually re-check now */
  recheck: () => void;
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const response = await fetch(CHECK_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus(): NetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const isMounted = useRef(true);

  const check = useCallback(async (): Promise<void> => {
    const connected = await checkConnectivity();
    if (isMounted.current) {
      setStatus(connected ? 'online' : 'offline');
      setLastChecked(Date.now());
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void check();

    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [check]);

  return {
    isConnected: status === 'online',
    status,
    lastChecked,
    recheck: () => void check(),
  };
}
