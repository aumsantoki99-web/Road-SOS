/**
 * Shared Utility Functions
 * feature/accessibility ✅ — accessibility helpers added
 *
 * Pure, side-effect-free helpers.
 * Do NOT import React or RN components here.
 */

// ─── ID Generation ────────────────────────────────────────────────────────────

/**
 * Generates a lightweight unique ID.
 * Replace with uuid library if collision safety is needed at scale.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Time / Duration ──────────────────────────────────────────────────────────

/**
 * Formats elapsed seconds into HH:MM:SS string.
 */
export function formatDuration(totalSeconds: number): string {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Returns a human-readable relative time string.
 */
export function timeAgo(timestampMs: number): string {
  const diffSeconds = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSeconds < 60)   return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

/**
 * Formats a Unix timestamp (ms) to a readable date string.
 */
export function formatDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * Formats a Unix timestamp (ms) to a readable time string.
 */
export function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Formats a phone number for display.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Returns true if the string is a valid 10-digit Indian mobile number.
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

// ─── Distance ─────────────────────────────────────────────────────────────────

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

// ─── String ───────────────────────────────────────────────────────────────────

export function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

// ─── Accessibility ────────────────────────────────────────────────────────────
// Re-exported from dedicated file for a single import path

export {
  expandHitSlop,
  buttonA11y,
  imageA11y,
  listItemA11y,
  inputA11y,
  buildAnnouncement,
  contrastRatio,
  MIN_TOUCH_TARGET,
} from './accessibility';
