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

import * as SecureStore from 'expo-secure-store';
import { APP_STORAGE_SCHEMA_VERSION, STORAGE_KEYS } from '../constants';
import type { StorageKey } from '../constants';
import type { AuthProfile } from '../types';

// ─── Result type ──────────────────────────────────────────────────────────────

export type StorageResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

function hashPassword(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `rs_${Math.abs(hash).toString(16)}`;
}

/**
 * Expo SecureStore strictly requires keys to contain only alphanumeric characters, `.`, `-`, and `_`.
 * This helper sanitizes internal keys (like `@ridesafe/contacts`) to comply with this requirement.
 */
function getSafeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const StorageService = {

  /**
   * Read and JSON-parse a value by key.
   * Returns null if the key doesn't exist.
   */
  async get<T>(key: StorageKey): Promise<StorageResult<T | null>> {
    try {
      const raw = await SecureStore.getItemAsync(getSafeKey(key));
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
      await SecureStore.setItemAsync(getSafeKey(key), JSON.stringify(value));
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
      await SecureStore.deleteItemAsync(getSafeKey(key));
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
      await Promise.all(keys.map(k => SecureStore.deleteItemAsync(getSafeKey(k))));
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
      const raw = await SecureStore.getItemAsync(getSafeKey(key));
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
      const result: Record<string, T | null> = {};
      for (const key of keys) {
        const raw = await SecureStore.getItemAsync(getSafeKey(key));
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
      await SecureStore.getItemAsync(getSafeKey('@ridesafe/__init_check__'));
      await StorageService.runMigrations();
      return true;
    } catch (err) {
      console.warn('[StorageService] Storage not accessible:', err);
      return false;
    }
  },

  async runMigrations(): Promise<void> {
    const schema = await StorageService.get<number>(STORAGE_KEYS.STORAGE_SCHEMA_VERSION);
    const currentVersion = schema.success && typeof schema.data === 'number' ? schema.data : 1;

    if (currentVersion >= APP_STORAGE_SCHEMA_VERSION) return;

    if (currentVersion < 2) {
      const profile = await StorageService.get<(AuthProfile & { password?: string })>(STORAGE_KEYS.AUTH_PROFILE);
      if (profile.success && profile.data && !profile.data.passwordHash && profile.data.password) {
        const migrated: AuthProfile = {
          fullName: profile.data.fullName,
          email: profile.data.email,
          mobileNo: profile.data.mobileNo,
          bloodGroup: profile.data.bloodGroup,
          aadharCard: profile.data.aadharCard,
          additionalMedicalInfo: profile.data.additionalMedicalInfo,
          createdAt: profile.data.createdAt,
          passwordHash: hashPassword(profile.data.password),
        };
        await StorageService.set(STORAGE_KEYS.AUTH_PROFILE, migrated);
      }
    }

    await StorageService.set(STORAGE_KEYS.STORAGE_SCHEMA_VERSION, APP_STORAGE_SCHEMA_VERSION);
  },
} as const;
