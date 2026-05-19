/**
 * RideSafe Spacing System
 *
 * Base unit: 4pt (Apple HIG / Material Design aligned)
 * All spacing values are multiples of 4.
 *
 * Philosophy:
 *   Generous breathing room on safety-critical screens.
 *   Touch targets always >= 44pt (Apple HIG minimum).
 *   Content never fights for space.
 */

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const spacing = {
  0: 0,
  0.5: 2,   // hairline gaps
  1: 4,     // micro — icon internal padding
  1.5: 6,   // tight — badge padding
  2: 8,     // small — inner card padding, icon margins
  2.5: 10,  // medium-small
  3: 12,    // default — label gaps, list item padding
  4: 16,    // base — standard element padding
  5: 20,    // medium — card internal horizontal padding
  6: 24,    // section — card padding, section gaps
  7: 28,
  8: 32,    // large — screen horizontal padding, modal padding
  10: 40,
  12: 48,   // xl — section separators
  14: 56,
  16: 64,   // 2xl — hero sections
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingKey];

// ─── Semantic Spacing ─────────────────────────────────────────────────────────
// Named aliases — use these in components for semantic clarity.

export const layout = {
  /** Horizontal padding applied to every screen */
  screenHorizontal: spacing[5],

  /** Vertical padding at top of screen content */
  screenVerticalTop: spacing[6],

  /** Vertical padding at bottom of screen content */
  screenVerticalBottom: spacing[8],

  /** Gap between major screen sections */
  sectionGap: spacing[6],

  /** Internal padding for standard cards */
  cardPadding: spacing[5],

  /** Internal padding for compact cards */
  cardPaddingCompact: spacing[4],

  /** Horizontal padding for list items */
  listItemHorizontal: spacing[5],

  /** Vertical padding for list items */
  listItemVertical: spacing[4],

  /** Gap between list items */
  listItemGap: spacing[3],

  /** Gap between stacked cards */
  cardGap: spacing[3],

  /** Standard icon size (small) */
  iconSm: 18,

  /** Standard icon size (medium) */
  iconMd: 22,

  /** Standard icon size (large) */
  iconLg: 28,

  /** Hero icon size */
  iconHero: 40,

  /** Minimum touch target — Apple HIG */
  minTouchTarget: 44,

  /** Bottom tab bar height */
  tabBarHeight: 64,

  /** Bottom tab bar height with safe area */
  tabBarHeightSafe: 84,

  /** Standard avatar size */
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 56,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999, // circular
} as const;

export type RadiusKey = keyof typeof radius;

// ─── Border Width ─────────────────────────────────────────────────────────────

export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;
