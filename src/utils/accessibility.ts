/**
 * Accessibility Utilities
 *
 * Centralised helpers to ensure consistent accessibility across
 * all components. Used in feature/accessibility branch.
 *
 * Standards followed:
 *   - Apple Human Interface Guidelines (iOS)
 *   - Material Design Accessibility (Android)
 *   - WCAG 2.1 AA contrast ratios
 *   - React Native accessibility props best practices
 *
 * Minimum touch target: 44×44pt (Apple HIG)
 * Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
 */

import type { AccessibilityRole, AccessibilityState } from 'react-native';

// ─── Touch target ─────────────────────────────────────────────────────────────

export const MIN_TOUCH_TARGET = 44;

/**
 * hitSlop that expands a small touch area to the minimum 44pt target.
 * Use on icon buttons, checkboxes, small interactive elements.
 */
export function expandHitSlop(
  currentSize: number,
): { top: number; bottom: number; left: number; right: number } {
  const expansion = Math.max(0, (MIN_TOUCH_TARGET - currentSize) / 2);
  return {
    top:    expansion,
    bottom: expansion,
    left:   expansion,
    right:  expansion,
  };
}

// ─── Accessibility props builders ─────────────────────────────────────────────

/**
 * Build standardised accessibility props for a button.
 */
export function buttonA11y(
  label: string,
  options: {
    hint?: string;
    disabled?: boolean;
    busy?: boolean;
  } = {},
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState: AccessibilityState;
} {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    ...(options.hint ? { accessibilityHint: options.hint } : {}),
    accessibilityState: {
      disabled: options.disabled ?? false,
      busy:     options.busy ?? false,
    },
  };
}

/**
 * Build standardised accessibility props for an image/icon.
 */
export function imageA11y(
  label: string,
  decorative = false,
): {
  accessible: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel?: string;
} {
  if (decorative) {
    return { accessible: false, accessibilityRole: 'image' };
  }
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: label,
  };
}

/**
 * Build accessibility props for a list item.
 */
export function listItemA11y(
  label: string,
  hint?: string,
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
} {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

/**
 * Build accessibility props for a text input.
 */
export function inputA11y(
  label: string,
  options: {
    hint?: string;
    required?: boolean;
    errorMessage?: string;
  } = {},
): {
  accessible: true;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRequired?: boolean;
  accessibilityInvalid?: boolean;
  accessibilityErrorMessage?: string;
} {
  return {
    accessible: true,
    accessibilityLabel: options.required ? `${label}, required` : label,
    ...(options.hint ? { accessibilityHint: options.hint } : {}),
    ...(options.required !== undefined ? { accessibilityRequired: options.required } : {}),
    ...(options.errorMessage
      ? {
          accessibilityInvalid: true,
          accessibilityErrorMessage: options.errorMessage,
        }
      : {}),
  };
}

// ─── Screen reader announcements ──────────────────────────────────────────────

/**
 * Announce a message to the screen reader.
 * Use for dynamic content changes (ride started, SOS sent, etc.)
 *
 * Usage:
 *   import { AccessibilityInfo } from 'react-native';
 *   announceToScreenReader('Ride started. Safety monitoring is now active.');
 */
export function buildAnnouncement(
  event: 'ride_start' | 'ride_stop' | 'sos_triggered' | 'sos_cancelled' | 'contact_added',
): string {
  const messages: Record<string, string> = {
    ride_start:     'Ride started. Safety monitoring is now active.',
    ride_stop:      'Ride ended. Your ride summary is ready.',
    sos_triggered:  'SOS alert sent to your emergency contacts.',
    sos_cancelled:  'SOS alert cancelled.',
    contact_added:  'Emergency contact added successfully.',
  };
  return messages[event] ?? '';
}

// ─── Color contrast check (development helper) ────────────────────────────────

/**
 * Approximate relative luminance from a hex color.
 * Used during development to verify contrast ratios.
 * Not called at runtime in production.
 */
export function relativeLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const toLinear = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Ratio >= 4.5 → WCAG AA for normal text
 * Ratio >= 3.0 → WCAG AA for large text / UI components
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
