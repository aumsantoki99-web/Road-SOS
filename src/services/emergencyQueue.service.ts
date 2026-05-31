import NetInfo, { type NetInfoSubscription } from '@react-native-community/netinfo';

import { EMERGENCY_DATABASE_SERVER, STORAGE_KEYS } from '../constants';
import type { OfflineReason, PendingEmergencyEvent } from '../types';
import { StorageService } from '../storage/StorageService';
import { requestJson } from './apiClient';

interface LogEmergencyResponse {
  success?: boolean;
}

let connectivitySubscription: NetInfoSubscription | null = null;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function getQueue(): Promise<PendingEmergencyEvent[]> {
  const result = await StorageService.get<PendingEmergencyEvent[]>(STORAGE_KEYS.PENDING_EMERGENCY_EVENTS);
  if (!result.success) {
    console.warn('[EmergencyQueueService] Failed to load pending events queue:', result.error);
    return [];
  }
  return result.data ?? [];
}

async function setQueue(queue: PendingEmergencyEvent[]): Promise<void> {
  await StorageService.set(STORAGE_KEYS.PENDING_EMERGENCY_EVENTS, queue);
}

export async function queueEmergencyEvent(
  lat: number,
  lng: number,
  category: string,
  offlineReason: OfflineReason,
): Promise<PendingEmergencyEvent | null> {
  try {
    const event: PendingEmergencyEvent = {
      eventId: generateUUID(),
      timestamp: Date.now(),
      lat,
      lng,
      category,
      offlineReason,
    };

    const queue = await getQueue();
    queue.push(event);
    await setQueue(queue);

    void syncPendingQueue();
    return event;
  } catch (error) {
    console.warn('[EmergencyQueueService] Failed to queue emergency event:', error);
    return null;
  }
}

export async function syncPendingQueue(): Promise<{ synced: number; failed: number }> {
  try {
    const network = await NetInfo.fetch();
    if (!network.isConnected) return { synced: 0, failed: 0 };

    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    const failedToSync: PendingEmergencyEvent[] = [];
    let synced = 0;

    for (const event of queue) {
      try {
        const result = await requestJson<LogEmergencyResponse>(`${EMERGENCY_DATABASE_SERVER}/log-emergency-event`, {
          method: 'POST',
          headers: {
            'X-Idempotency-Key': event.eventId,
            'Bypass-Tunnel-Reminder': 'true',
          },
          body: event,
        });
        if (result.success) {
          synced += 1;
        } else {
          failedToSync.push(event);
        }
      } catch {
        failedToSync.push(event);
      }
    }

    await setQueue(failedToSync);
    return { synced, failed: failedToSync.length };
  } catch (error) {
    console.warn('[EmergencyQueueService] Failed to sync pending queue:', error);
    return { synced: 0, failed: 0 };
  }
}

export function startEmergencyQueueAutoSync(): void {
  if (connectivitySubscription) return;
  connectivitySubscription = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void syncPendingQueue();
    }
  });
}

export function stopEmergencyQueueAutoSync(): void {
  connectivitySubscription?.();
  connectivitySubscription = null;
}

