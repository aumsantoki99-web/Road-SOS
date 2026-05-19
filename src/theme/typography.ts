/**
 * RideSafe Typography System
 *
 * Font Pairing:
 *   Display / Headers → Syne (geometric, confident, distinctly non-generic)
 *   UI / Body         → DM Sans (clean, rounded, deeply readable at speed)
 *
 * Why this pairing:
 *   Syne has a controlled tension — it's technical but not cold.
 *   DM Sans is legible at small sizes even with rider gloves (large touch targets).
 *   Together they read as "premium safety tech", not generic mobile app.
 *
 * Scale: Major Third (1.250) modular scale from 14px base.
 *   xs:  11  → metadata, timestamps
 *   sm:  13  → captions, helper text
 *   md:  16  → body (base)
 *   lg:  20  → subheadings
 *   xl:  24  → section headings
 *   2xl: 30  → screen headings
 *   3xl: 38  → hero numbers (speed, timer)
 *   4xl: 48  → max display (emergency callout)
 */

import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

// ─── Font Families ────────────────────────────────────────────────────────────

export const fontFamilies = {
  /**
   * Display font — Syne
   * Used for: screen titles, hero numbers, brand moments
   * Load via: expo-font (see fonts.ts)
   */
  display: 'Syne_700Bold',
  displayMedium: 'Syne_600SemiBold',

  /**
   * UI font — DM Sans
   * Used for: body, labels, buttons, everything else
   * Load via: expo-font (see fonts.ts)
   */
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',

  /**
   * Monospace — for numbers (speed, distance, timer)
   * System fallback — no extra font load needed
   */
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
} as const;

export type FontFamily = keyof typeof fontFamilies;

// ─── Font Sizes ───────────────────────────────────────────────────────────────

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
} as const;

export type FontSize = keyof typeof fontSizes;

// ─── Line Heights ─────────────────────────────────────────────────────────────
// Tighter for display, more open for body (readability while moving)

export const lineHeights = {
  tight: 1.1,    // display / hero numbers
  snug: 1.25,    // headings
  normal: 1.5,   // body (standard)
  relaxed: 1.65, // long-form content / descriptions
} as const;

// ─── Letter Spacing ───────────────────────────────────────────────────────────

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  caps: 1.5,     // ALL CAPS labels
} as const;

// ─── Font Weights ─────────────────────────────────────────────────────────────
// Typed as TextStyle['fontWeight'] for React Native compatibility

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const;

// ─── Composed Text Styles ─────────────────────────────────────────────────────
// Pre-built styles to use directly in components.
// All sizes in pts; line heights as multipliers applied inline.

export const textStyles = {
  // ── Display (Syne) ──────────────────────────────────────────────────────
  /** Screen-level hero heading */
  displayHero: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    letterSpacing: letterSpacing.tighter,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  } satisfies TextStyle,

  /** Screen title (e.g. "RideSafe") */
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['3xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  } satisfies TextStyle,

  /** Section display heading */
  displayMedium: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes['2xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
  } satisfies TextStyle,

  /** Card headline, modal title */
  displaySmall: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes.xl,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.xl * lineHeights.snug,
  } satisfies TextStyle,

  // ── Headings (DM Sans Bold) ──────────────────────────────────────────────
  headingLarge: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.xl,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSizes.xl * lineHeights.snug,
  } satisfies TextStyle,

  headingMedium: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.lg,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.lg * lineHeights.snug,
  } satisfies TextStyle,

  headingSmall: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.md * lineHeights.snug,
  } satisfies TextStyle,

  // ── Body (DM Sans) ───────────────────────────────────────────────────────
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.lg * lineHeights.normal,
  } satisfies TextStyle,

  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.md * lineHeights.normal,
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } satisfies TextStyle,

  // ── Labels / UI text ─────────────────────────────────────────────────────
  /** Button labels, tab labels */
  labelLarge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.wide,
    lineHeight: fontSizes.md * lineHeights.snug,
  } satisfies TextStyle,

  labelMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacing.wide,
    lineHeight: fontSizes.sm * lineHeights.snug,
  } satisfies TextStyle,

  /** ALL CAPS section labels, stat captions */
  labelCaps: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacing.caps,
    lineHeight: fontSizes.xs * lineHeights.snug,
  } satisfies TextStyle,

  // ── Captions / Metadata ──────────────────────────────────────────────────
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.xs * lineHeights.relaxed,
  } satisfies TextStyle,

  // ── Numeric / Mono (ride stats, timer) ───────────────────────────────────
  /** Large ride stat number — speed, timer */
  numericHero: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes['3xl'],
    letterSpacing: letterSpacing.tighter,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
  } satisfies TextStyle,

  numericLarge: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes['2xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  } satisfies TextStyle,

  numericSmall: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.lg,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSizes.lg * lineHeights.tight,
  } satisfies TextStyle,
} as const;

export type TextStyleKey = keyof typeof textStyles;
