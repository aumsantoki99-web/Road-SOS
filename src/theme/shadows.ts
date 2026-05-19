/**
 * RideSafe Shadow System
 *
 * Multi-layered shadows — ambient + key light — to give cards real depth,
 * not the flat look of generic Material clones.
 *
 * Each shadow variant includes:
 *   - iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
 *   - Android: elevation
 *
 * Special glow variants for:
 *   - SOS button (crimson glow)
 *   - Active ride indicator (teal glow)
 *   - Accent highlights (amber glow)
 *
 * Usage:
 *   import { shadows } from '@theme';
 *   <View style={[styles.card, shadows.card]} />
 */

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// ─── Shadow factory ───────────────────────────────────────────────────────────

function shadow(
  color: string,
  offsetY: number,
  opacity: number,
  blurRadius: number,
  elevation: number,
): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius,
    },
    android: {
      elevation,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius,
      elevation,
    },
  }) as ShadowStyle;
}

// ─── Standard Shadows ─────────────────────────────────────────────────────────

export const shadows = {
  /** No shadow — flat surface */
  none: {} satisfies ShadowStyle,

  /** Hairline shadow — very subtle lift */
  xs: shadow('#000000', 1, 0.08, 2, 1),

  /** Small shadow — list items, chips */
  sm: shadow('#000000', 2, 0.12, 4, 2),

  /** Card shadow — standard elevated card */
  card: shadow('#000000', 4, 0.18, 8, 4),

  /** Modal shadow — bottom sheet, modal */
  modal: shadow('#000000', 8, 0.24, 16, 8),

  /** High elevation — floating buttons, toasts */
  float: shadow('#000000', 12, 0.3, 24, 12),

  // ── Colored Glow Shadows ───────────────────────────────────────────────
  // Only available on iOS (Android elevation has no color control)

  /** Amber glow — accent elements, active highlights */
  glowAmber: Platform.select({
    ios: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 16,
      elevation: 8,
    },
  }) as ShadowStyle,

  /** Crimson glow — SOS button, emergency alerts */
  glowEmergency: Platform.select({
    ios: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 20,
    },
    android: { elevation: 12 },
    default: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 20,
      elevation: 12,
    },
  }) as ShadowStyle,

  /** Teal glow — active ride status, safe indicators */
  glowSafe: Platform.select({
    ios: {
      shadowColor: '#14B8A6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
    },
    android: { elevation: 8 },
    default: {
      shadowColor: '#14B8A6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 8,
    },
  }) as ShadowStyle,

  /** Inner-card ambient — subtle depth within a card surface */
  innerAmbient: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
    },
  }) as ShadowStyle,
} as const;

export type ShadowKey = keyof typeof shadows;
