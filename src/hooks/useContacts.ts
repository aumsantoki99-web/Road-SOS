/**
 * useContacts — Emergency Contacts CRUD hook
 *
 * Single source of truth for all emergency contact operations.
 * Persists to AsyncStorage so contacts survive app restarts.
 *
 * Architecture is sync-ready:
 *   - All writes go through a single mutate function
 *   - Each mutation is timestamped (updatedAt)
 *   - IDs are stable UUIDs — safe to use as FK in backend sync
 *   - TODO (feature/local-storage): replace direct AsyncStorage calls
 *     with StorageService.setContacts() / StorageService.getContacts()
 *   - TODO (backend): after each mutation, push diff to SyncService
 *
 * Usage:
 *   const { contacts, addContact, editContact, deleteContact,
 *           setPrimary, isLoading, error } = useContacts();
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils';
import { STORAGE_KEYS } from '../constants';
import type { EmergencyContact } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContactInput = Pick<EmergencyContact, 'name' | 'phone' | 'relationship'>;

interface ContactsResult {
  contacts: EmergencyContact[];
  isLoading: boolean;
  error: string | null;
  addContact: (input: ContactInput) => Promise<EmergencyContact>;
  editContact: (id: string, input: Partial<ContactInput>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function loadFromStorage(): Promise<EmergencyContact[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
  if (!raw) return [];
  return JSON.parse(raw) as EmergencyContact[];
}

async function saveToStorage(contacts: EmergencyContact[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContacts(): ContactsResult {
  const [contacts, setContacts]   = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadFromStorage();
      setContacts(loaded);
    } catch {
      setError('Could not load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const addContact = useCallback(async (input: ContactInput): Promise<EmergencyContact> => {
    const now = Date.now();
    const newContact: EmergencyContact = {
      id: generateId(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      relationship: input.relationship.trim(),
      // First contact added becomes primary automatically
      isPrimary: contacts.length === 0,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    await saveToStorage(updated);
    // TODO (backend): SyncService.pushContactCreate(newContact)
    return newContact;
  }, [contacts]);

  // ── Edit ───────────────────────────────────────────────────────────────────
  const editContact = useCallback(async (
    id: string,
    input: Partial<ContactInput>,
  ): Promise<void> => {
    const updated = contacts.map((c) =>
      c.id === id
        ? {
            ...c,
            ...input,
            name:         input.name?.trim()         ?? c.name,
            phone:        input.phone?.trim()         ?? c.phone,
            relationship: input.relationship?.trim()  ?? c.relationship,
            updatedAt:    Date.now(),
          }
        : c,
    );
    setContacts(updated);
    await saveToStorage(updated);
    // TODO (backend): SyncService.pushContactUpdate(id, input)
  }, [contacts]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteContact = useCallback(async (id: string): Promise<void> => {
    const remaining = contacts.filter((c) => c.id !== id);

    // If we deleted the primary, promote the first remaining contact
    const deletedWasPrimary = contacts.find((c) => c.id === id)?.isPrimary ?? false;
    const promoted = deletedWasPrimary && remaining.length > 0
      ? remaining.map((c, i) => i === 0 ? { ...c, isPrimary: true } : c)
      : remaining;

    setContacts(promoted);
    await saveToStorage(promoted);
    // TODO (backend): SyncService.pushContactDelete(id)
  }, [contacts]);

  // ── Set primary ────────────────────────────────────────────────────────────
  const setPrimary = useCallback(async (id: string): Promise<void> => {
    const updated = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
      updatedAt: c.id === id ? Date.now() : c.updatedAt,
    }));
    setContacts(updated);
    await saveToStorage(updated);
  }, [contacts]);

  return {
    contacts,
    isLoading,
    error,
    addContact,
    editContact,
    deleteContact,
    setPrimary,
    reload,
  };
}
