/**
 * StorageService — AsyncStorage abstraction layer
 *
 * Why this exists instead of calling AsyncStorage directly:
 *   - Type-safe get/set for every key
 *   - Centralised error handling — no try/catch scattered in components
 *   - JSON parse/stringify handled once, not per call-site
 *   - Easy to swap backend (MMKV, SecureStore, Firestore) later
 *   - All keys defined in constants — no magic strings
 *
 * Usage:
 *   await StorageService.set('contacts', contacts);
 *   const contacts = await StorageService.get<EmergencyContact[]>('contacts');
 *   await StorageService.remove('contacts');
 *   await StorageService.clear(); // wipe all RideSafe keys
 *
 * TODO (backend sync): after each set(), call SyncService.markDirty(key)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { StorageKey } from '../constants';

// ─── Result type ──────────────────────────────────────────────────────────────

export type StorageResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

// ─── Service ──────────────────────────────────────────────────────────────────

export const StorageService = {

  /**
   * Read and JSON-parse a value by key.
   * Returns null if the key doesn't exist.
   */
  async get<T>(key: StorageKey): Promise<StorageResult<T | null>> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return { success: true, data: null };
      return { success: true, data: JSON.parse(raw) as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown read error';
      console.warn(`[StorageService] get(${key}) failed:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * JSON-stringify and write a value by key.
   */
  async set<T>(key: StorageKey, value: T): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return { success: true, data: undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown write error';
      console.warn(`[StorageService] set(${key}) failed:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * Remove a key entirely.
   */
  async remove(key: StorageKey): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true, data: undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown remove error';
      console.warn(`[StorageService] remove(${key}) failed:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * Clear ALL RideSafe keys (not the entire AsyncStorage).
   * Used for "Reset app data" in settings.
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return { success: true, data: undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown clear error';
      console.warn('[StorageService] clear() failed:', message);
      return { success: false, error: message };
    }
  },

  /**
   * Check whether a key has a stored value.
   */
  async has(key: StorageKey): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw !== null;
    } catch {
      return false;
    }
  },

  /**
   * Read multiple keys at once. More efficient than multiple get() calls.
   * Returns a map of key → parsed value.
   */
  async getMany<T>(keys: StorageKey[]): Promise<Record<string, T | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, T | null> = {};
      for (const [key, raw] of pairs) {
        result[key] = raw !== null ? (JSON.parse(raw) as T) : null;
      }
      return result;
    } catch (err) {
      console.warn('[StorageService] getMany() failed:', err);
      return {};
    }
  },

  /**
   * Initialize storage on app launch.
   * Verifies AsyncStorage is accessible.
   * Call this in App.tsx before rendering.
   */
  async initialize(): Promise<boolean> {
    try {
      await AsyncStorage.getItem('@ridesafe/__init_check__');
      return true;
    } catch (err) {
      console.warn('[StorageService] Storage not accessible:', err);
      return false;
    }
  },
} as const;
