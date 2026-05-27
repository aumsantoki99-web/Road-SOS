/**
 * NetworkContext — Global network state provider
 *
 * Wraps useNetworkStatus and exposes connectivity to the entire app tree.
 * Also triggers QueueService.flush() automatically when coming back online.
 *
 * Usage:
 *   const { isConnected, status } = useNetwork();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { QueueService } from '../storage/QueueService';
import {
  startEmergencyQueueAutoSync,
  stopEmergencyQueueAutoSync,
  syncPendingQueue,
} from '../services/emergencyQueue.service';
import type { NetworkStatus } from '../types';

interface NetworkContextValue {
  isConnected: boolean;
  status: NetworkStatus;
  lastChecked: number | null;
  recheck: () => void;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const network = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    startEmergencyQueueAutoSync();
    return () => {
      stopEmergencyQueueAutoSync();
    };
  }, []);

  // Auto-flush queue when coming back online
  useEffect(() => {
    if (!network.isConnected) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current && network.isConnected) {
      wasOffline.current = false;
      // TODO (feature/placeholder-services): SyncService.flush()
      void QueueService.flush();
      void syncPendingQueue();
    }
  }, [network.isConnected]);

  return (
    <NetworkContext.Provider value={network}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used within NetworkProvider.');
  return context;
}
