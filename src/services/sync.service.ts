/**
 * SyncService — Placeholder
 *
 * Integration point for backend data synchronisation.
 *
 * When connecting real sync:
 *   Option A — Firebase Firestore:
 *     import firestore from '@react-native-firebase/firestore';
 *     firestore().collection('rides').doc(rideId).set(rideData);
 *
 *   Option B — REST API:
 *     await fetch(`${API_BASE}/sync`, {
 *       method: 'POST',
 *       headers: { Authorization: `Bearer ${token}` },
 *       body: JSON.stringify(payload),
 *     });
 *
 *   Option C — WebSocket (real-time):
 *     ws.send(JSON.stringify({ type: 'RIDE_UPDATE', payload: rideData }));
 *
 * Architecture:
 *   - SyncService.push() is called after each local write
 *   - If offline, QueueService.enqueue() handles retry
 *   - NetworkContext calls flush() when connection restores
 *
 * DO NOT implement real sync logic here.
 * This file is owned by: feature/placeholder-services
 */

import { QueueService } from '../storage/QueueService';
import { syncPendingQueue } from './emergencyQueue.service';
import { STORAGE_KEYS } from '../constants';
import { StorageService } from '../storage/StorageService';
import type { EmergencyContact, RideSession } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncEntity = 'contact' | 'ride' | 'preferences';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  timestamp: number;
}

export interface SyncWorkResult extends SyncResult {
  emergencySynced: number;
  emergencyFailed: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const SyncService = {

  /**
   * Push a ride session to the backend.
   *
   * TODO:
   *   const ref = firestore().collection('users').doc(userId).collection('rides').doc(session.id);
   *   await ref.set({ ...session, syncedAt: firestore.FieldValue.serverTimestamp() });
   */
  async pushRideSession(session: RideSession): Promise<void> {
    const existing = await StorageService.get<RideSession[]>(STORAGE_KEYS.RIDE_HISTORY);
    const rides = existing.success && existing.data ? existing.data : [];
    const updated = [session, ...rides.filter((ride) => ride.id !== session.id)];
    await StorageService.set(STORAGE_KEYS.RIDE_HISTORY, updated);
  },

  /**
   * Push contact changes to the backend.
   *
   * TODO:
   *   await fetch(`${API_BASE}/contacts`, {
   *     method: 'PUT',
   *     body: JSON.stringify(contacts),
   *     headers: { Authorization: `Bearer ${token}` },
   *   });
   */
  async pushContacts(contacts: EmergencyContact[]): Promise<void> {
    await StorageService.set(STORAGE_KEYS.CONTACTS, contacts);
  },

  /**
   * Flush all pending queue items to the backend.
   * Called by NetworkContext when connection is restored.
   */
  async flush(): Promise<SyncResult> {
    console.warn('[SyncService] flush() — delegating to QueueService');
    const { synced, failed } = await QueueService.flush();
    return {
      success: failed === 0,
      synced,
      failed,
      timestamp: Date.now(),
    };
  },

  async flushAllPendingWork(): Promise<SyncWorkResult> {
    const generic = await SyncService.flush();
    const emergency = await syncPendingQueue();
    return {
      ...generic,
      success: generic.failed === 0 && emergency.failed === 0,
      emergencySynced: emergency.synced,
      emergencyFailed: emergency.failed,
    };
  },

  /**
   * Mark a local entity as dirty (needing sync).
   * Called after every local write in StorageService.
   *
   * TODO: implement a dirty-flag map and batch sync on interval.
   */
  markDirty(entity: SyncEntity, id: string): void {
    console.log(`[SyncService] markDirty(${entity}, ${id})`);
  },

  /**
   * Pull latest data from the backend and merge into local storage.
   *
   * TODO:
   *   const snapshot = await firestore().collection('users').doc(userId).get();
   *   await StorageService.set(STORAGE_KEYS.CONTACTS, snapshot.data()?.contacts ?? []);
   */
  async pull(): Promise<void> {
    await SyncService.flushAllPendingWork();
  },
} as const;
