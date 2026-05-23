/**
 * Global TypeScript type definitions for RideSafe
 *
 * All shared types, interfaces, and enums live here.
 * Screen-specific types stay in their own screen folder.
 */

// ─── Ride ────────────────────────────────────────────────────────────────────

export type RideStatus = 'idle' | 'active' | 'paused' | 'ended';

export interface RideSession {
  id: string;
  startTime: number; // Unix timestamp ms
  endTime?: number;
  status: RideStatus;
  /** Populated by ML/crash module — DO NOT implement here */
  crashDetected?: boolean;
  /** Populated by GPS module — DO NOT implement here */
  distanceKm?: number;
  /** Populated by GPS module — DO NOT implement here */
  avgSpeedKmh?: number;
}

// ─── Emergency Contact ───────────────────────────────────────────────────────

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Medical ID Profile ──────────────────────────────────────────────────────

export interface MedicalProfile {
  name: string;
  phone: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | '';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '';
  conditions: string;
  serverUrl?: string;
}

// ─── Hospital ────────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  distanceKm: number;
  /** Populated by Maps module — DO NOT implement here */
  etaMinutes?: number;
  isEmergencyCenter: boolean;
  /** Populated by Maps SDK — DO NOT implement here */
  latitude?: number;
  /** Populated by Maps SDK — DO NOT implement here */
  longitude?: number;
  specialties: string[];
}

// ─── Offline Queue ───────────────────────────────────────────────────────────

export type AlertType = 'crash' | 'sos' | 'ride_start' | 'ride_end';
export type QueueItemStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface QueuedAlert {
  id: string;
  type: AlertType;
  payload: Record<string, unknown>;
  status: QueueItemStatus;
  createdAt: number;
  retryCount: number;
}

// ─── Settings / Preferences ──────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';
export type CrashSensitivity = 'low' | 'medium' | 'high';
export type AppLanguage = 'en' | 'hi' | 'gu';

export interface UserPreferences {
  themeMode: ThemeMode;
  crashSensitivity: CrashSensitivity;
  notificationsEnabled: boolean;
  offlineModeEnabled: boolean;
  autoShareLocation: boolean;
  rideAutoStart: boolean;
  language: AppLanguage;
}

// ─── Network ─────────────────────────────────────────────────────────────────

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface NetworkState {
  status: NetworkStatus;
  isConnected: boolean;
  connectionType?: string;
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  isInitialized: boolean;
  currentRide: RideSession | null;
  networkState: NetworkState;
  preferences: UserPreferences;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
// Full navigation types defined in src/navigation/types.ts
// Re-exported here for convenience

export type { RootStackParamList, TabParamList } from '../navigation/types';
