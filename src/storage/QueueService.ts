/**
 * QueueService — Offline alert queue
 *
 * When the device is offline, safety-critical events (SOS, crash alerts,
 * ride start/end) are queued locally and replayed when connectivity returns.
 *
 * Architecture:
 *   - Queue persists to AsyncStorage — survives app kill
 *   - Each item has a status: pending → syncing → synced | failed
 *   - Failed items retry up to MAX_RETRY_COUNT times
 *   - Items expire after 24h (stale alerts aren't useful)
 *
 * Integration points:
 *   - enqueue()  → called by EmergencyService, RideService on offline write
 *   - flush()    → called by NetworkContext when connection restores
 *   - TODO: flush() body connects to SyncService.push() per item type
 *
 * Usage:
 *   await QueueService.enqueue({ type: 'sos', payload: { contactIds } });
 *   await QueueService.flush(); // called by NetworkContext on reconnect
 *   const items = await QueueService.getAll();
 */

import { StorageService } from './StorageService';
import { STORAGE_KEYS, QUEUE_CONSTANTS } from '../constants';
import { generateId } from '../utils';
import type { QueuedAlert, AlertType } from '../types';

// ─── Expiry ───────────────────────────────────────────────────────────────────

const ITEM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Service ──────────────────────────────────────────────────────────────────

export const QueueService = {

  /**
   * Load all non-expired queue items from storage.
   */
  async getAll(): Promise<QueuedAlert[]> {
    const result = await StorageService.get<QueuedAlert[]>(STORAGE_KEYS.ALERT_QUEUE);
    if (!result.success || result.data === null) return [];

    const now = Date.now();
    // Filter out expired items automatically
    return result.data.filter((item) => now - item.createdAt < ITEM_EXPIRY_MS);
  },

  /**
   * Add a new alert to the queue.
   */
  async enqueue(
    type: AlertType,
    payload: Record<string, unknown>,
  ): Promise<QueuedAlert> {
    const existing = await QueueService.getAll();

    // Enforce max queue size — drop oldest pending items if over limit
    const trimmed = existing.length >= QUEUE_CONSTANTS.MAX_QUEUE_SIZE
      ? existing.slice(existing.length - QUEUE_CONSTANTS.MAX_QUEUE_SIZE + 1)
      : existing;

    const item: QueuedAlert = {
      id: generateId(),
      type,
      payload,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    };

    await StorageService.set(STORAGE_KEYS.ALERT_QUEUE, [...trimmed, item]);
    return item;
  },

  /**
   * Update the status of a queue item.
   */
  async updateStatus(
    id: string,
    status: QueuedAlert['status'],
  ): Promise<void> {
    const items = await QueueService.getAll();
    const updated = items.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    await StorageService.set(STORAGE_KEYS.ALERT_QUEUE, updated);
  },

  /**
   * Increment retry count for a failed item.
   */
  async incrementRetry(id: string): Promise<void> {
    const items = await QueueService.getAll();
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, retryCount: item.retryCount + 1, status: 'failed' as const }
        : item,
    );
    await StorageService.set(STORAGE_KEYS.ALERT_QUEUE, updated);
  },

  /**
   * Remove a successfully synced item.
   */
  async remove(id: string): Promise<void> {
    const items = await QueueService.getAll();
    await StorageService.set(
      STORAGE_KEYS.ALERT_QUEUE,
      items.filter((item) => item.id !== id),
    );
  },

  /**
   * Attempt to flush all pending items to the backend.
   *
   * TODO (feature/placeholder-services):
   *   Replace the inner TODO block with SyncService.push(item)
   *   for each alert type.
   */
  async flush(): Promise<{ synced: number; failed: number }> {
    const items = await QueueService.getAll();
    const pending = items.filter(
      (item) =>
        item.status === 'pending' ||
        (item.status === 'failed' && item.retryCount < QUEUE_CONSTANTS.MAX_RETRY_COUNT),
    );

    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      await QueueService.updateStatus(item.id, 'syncing');
      try {
        // TODO: await SyncService.push(item);
        // Simulating success for now
        await QueueService.updateStatus(item.id, 'synced');
        synced++;
      } catch {
        await QueueService.incrementRetry(item.id);
        failed++;
      }
    }

    console.warn(`[QueueService] flush(): synced=${synced}, failed=${failed}`);
    return { synced, failed };
  },

  /**
   * Clear all items regardless of status.
   * Used by "Reset app data" in settings.
   */
  async clearAll(): Promise<void> {
    await StorageService.remove(STORAGE_KEYS.ALERT_QUEUE);
  },

  /**
   * Return only items that need attention (pending or failed under retry limit).
   */
  async getPending(): Promise<QueuedAlert[]> {
    const items = await QueueService.getAll();
    return items.filter(
      (item) =>
        item.status === 'pending' ||
        (item.status === 'failed' && item.retryCount < QUEUE_CONSTANTS.MAX_RETRY_COUNT),
    );
  },
} as const;
