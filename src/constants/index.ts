/**
 * App-wide Constants
 *
 * Avoid magic strings/numbers scattered in components.
 * Import from here: import { APP_NAME, STORAGE_KEYS } from '@constants';
 */

// ─── App Identity ────────────────────────────────────────────────────────────

export const APP_NAME = 'Rescuel';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Your ride partner';

// ─── Storage Keys ────────────────────────────────────────────────────────────
// Centralized to avoid typos and key collisions

export const STORAGE_KEYS = {
  CONTACTS: '@ridesafe/emergency_contacts',
  PREFERENCES: '@ridesafe/user_preferences',
  RIDE_HISTORY: '@ridesafe/ride_history',
  CURRENT_RIDE: '@ridesafe/current_ride',
  LAST_RIDE: '@ridesafe/last_ride',
  ALERT_QUEUE: '@ridesafe/alert_queue',
  EMERGENCY_PLACES_CACHE: '@emergency_places_cache',
  PENDING_EMERGENCY_EVENTS: '@pending_emergency_events',
  ONBOARDING_COMPLETE: '@ridesafe/onboarding_complete',
  LAST_SYNC: '@ridesafe/last_sync',
  MEDICAL_PROFILE: '@ridesafe/medical_profile',
  PROFILE_SETUP_DONE: '@ridesafe/profile_setup_done',
  SMS_PERMISSION_GRANTED: '@ridesafe/sms_permission_granted',
  AUTH_SESSION: '@ridesafe/auth_session',
  AUTH_PROFILE: '@ridesafe/auth_profile',
  LANGUAGE_SELECTED_ONBOARDING: '@ridesafe/language_selected_onboarding',
  THEME_MODE: '@ridesafe/theme_mode',
  STORAGE_SCHEMA_VERSION: '@ridesafe/storage_schema_version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Emergency Server ────────────────────────────────────────────────────────

export const EMERGENCY_SERVER = {
  DEFAULT_URL: 'https://rescuel-emergency-server.onrender.com',
  DEFAULT_VOICE_TARGET: '+919314050474',
  DEFAULT_HELPER_SMS: '+917359129704',
  API_KEY: 'roadsos-default-secret-key-123',
} as const;

export const EMERGENCY_DATABASE_SERVER = 'https://road-sos-flax.vercel.app';

export const NETWORK_CONSTANTS = {
  REQUEST_TIMEOUT_MS: 12000,
  RETRY_COUNT: 2,
  BACKOFF_BASE_MS: 700,
} as const;

export const APP_STORAGE_SCHEMA_VERSION = 2;

// ─── Default Preferences ────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  themeMode: 'system' as const,
  crashSensitivity: 'medium' as const,
  notificationsEnabled: true,
  offlineModeEnabled: true,
  autoShareLocation: false,
  rideAutoStart: false,
  language: 'en' as const,
  sosDelay: 10,
};

// ─── Ride ────────────────────────────────────────────────────────────────────

export const RIDE_CONSTANTS = {
  MIN_RIDE_DURATION_SECONDS: 30,
  CRASH_ALERT_DELAY_SECONDS: 30,
  MAX_SPEED_KMH: 200,
} as const;

// ─── Offline Queue ───────────────────────────────────────────────────────────

export const QUEUE_CONSTANTS = {
  MAX_RETRY_COUNT: 5,
  RETRY_DELAY_MS: 5000,
  MAX_QUEUE_SIZE: 100,
} as const;

// ─── UI ──────────────────────────────────────────────────────────────────────

export const UI_CONSTANTS = {
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 300,
  ANIMATION_DURATION_SLOW: 600,
  SOS_PULSE_DURATION: 1200,
  TOAST_DURATION_MS: 3000,
  MIN_TOUCH_TARGET_SIZE: 44, // Apple HIG minimum
} as const;

// ─── Placeholder / Mock ──────────────────────────────────────────────────────

/** Remove these when real services are connected */
export const MOCK_CONSTANTS = {
  MOCK_SPEED_KMH: 42,
  MOCK_DISTANCE_KM: 3.7,
  MOCK_ETA_MINUTES: 8,
} as const;
