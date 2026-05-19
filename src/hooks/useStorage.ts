/**
 * useStorage — React hook wrapping StorageService
 *
 * Provides reactive storage reads with loading/error states.
 * Syncs with AsyncStorage on mount and exposes a refresh function.
 *
 * Usage:
 *   const { data, isLoading, error, save, refresh } = useStorage<UserPreferences>(
 *     STORAGE_KEYS.PREFERENCES,
 *     DEFAULT_PREFERENCES,
 *   );
 */

import { useCallback, useEffect, useState } from 'react';
import { StorageService } from '../storage/StorageService';
import type { StorageKey } from '../constants';

interface UseStorageResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  save: (value: T) => Promise<boolean>;
  remove: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useStorage<T>(
  key: StorageKey,
  defaultValue: T,
): UseStorageResult<T> {
  const [data, setData]         = useState<T>(defaultValue);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const result = await StorageService.get<T>(key);
    if (result.success) {
      setData(result.data ?? defaultValue);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [key, defaultValue]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (value: T): Promise<boolean> => {
    const result = await StorageService.set(key, value);
    if (result.success) {
      setData(value);
      return true;
    }
    setError(result.error);
    return false;
  }, [key]);

  const remove = useCallback(async (): Promise<boolean> => {
    const result = await StorageService.remove(key);
    if (result.success) {
      setData(defaultValue);
      return true;
    }
    setError(result.error);
    return false;
  }, [key, defaultValue]);

  return { data, isLoading, error, save, remove, refresh: load };
}
