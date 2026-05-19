/**
 * RideSafe Color System
 *
 * Design philosophy:
 *   Dark-steel safety tech. The palette of a premium helmet HUD —
 *   deep slate blacks, electric amber hero accent, cool steel grays,
 *   and a crimson reserved *only* for emergency actions.
 *
 *   Every color has intent. Nothing is decorative without purpose.
 *
 * Structure:
 *   - primitive:  raw color values (never use directly in components)
 *   - semantic:   intent-based tokens (always use these in components)
 *   - light/dark: theme variants of semantic tokens
 *   - status:     safe | warning | danger | info
 *   - gradients:  prebuilt gradient stop arrays
 */

// ─── Primitive Palette ────────────────────────────────────────────────────────
// Raw values. Reference only from semantic tokens below.

const primitive = {
  // Slate (primary neutrals — dark theme base)
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate850: '#172033',
  slate900: '#0F172A',
  slate950: '#080E1A',

  // Amber (hero accent — rider energy, high-visibility safety)
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',

  // Crimson (emergency only — never use decoratively)
  crimson300: '#FCA5A5',
  crimson400: '#F87171',
  crimson500: '#EF4444',
  crimson600: '#DC2626',
  crimson700: '#B91C1C',
  crimson800: '#991B1B',

  // Teal (safe status — ride active, system healthy)
  teal300: '#5EEAD4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',
  teal700: '#0F766E',

  // Steel (secondary elements — cool, industrial)
  steel200: '#E8EDF2',
  steel300: '#C8D3DC',
  steel400: '#8FA3B4',
  steel500: '#5C7A8A',
  steel600: '#3D5A6C',
  steel700: '#263D4E',
  steel800: '#172535',

  // White / Black
  white: '#FFFFFF',
  black: '#000000',

  // Transparent
  transparent: 'transparent',
} as const;

// ─── Semantic Color Tokens ─────────────────────────────────────────────────────
// Use these in all components. Never import `primitive` directly.

export const darkColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bgPrimary: primitive.slate950,      // deepest bg — screen base
  bgSecondary: primitive.slate900,    // slightly lifted — section bg
  bgElevated: primitive.slate800,     // cards, modals
  bgMuted: primitive.slate850,        // subtle fills, disabled states

  // ── Surfaces (cards, sheets, inputs) ─────────────────────────────────────
  surfacePrimary: primitive.slate800,
  surfaceSecondary: primitive.slate700,
  surfaceBorder: primitive.slate700,
  surfaceBorderSubtle: primitive.slate800,

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary: primitive.slate50,
  textSecondary: primitive.slate300,
  textTertiary: primitive.slate500,
  textDisabled: primitive.slate600,
  textInverse: primitive.slate950,

  // ── Brand / Accent (Amber) ────────────────────────────────────────────────
  accent: primitive.amber400,
  accentMuted: primitive.amber700,
  accentSubtle: '#2A1F08',            // very dark amber tint for bg fills
  accentText: primitive.amber300,

  // ── Emergency / Danger (Crimson) ─────────────────────────────────────────
  // IMPORTANT: Use ONLY for SOS, crash alerts, delete confirmations
  emergency: primitive.crimson500,
  emergencyMuted: primitive.crimson800,
  emergencySubtle: '#1F0A0A',
  emergencyText: primitive.crimson300,
  emergencyBorder: primitive.crimson700,

  // ── Safe / Active (Teal) ─────────────────────────────────────────────────
  safe: primitive.teal500,
  safeMuted: primitive.teal700,
  safeSubtle: '#071A18',
  safeText: primitive.teal300,

  // ── Warning (Amber, lower saturation than accent) ─────────────────────────
  warning: primitive.amber500,
  warningMuted: primitive.amber700,
  warningSubtle: '#1F1507',
  warningText: primitive.amber300,

  // ── Info (Steel blue) ─────────────────────────────────────────────────────
  info: primitive.steel400,
  infoMuted: primitive.steel700,
  infoSubtle: '#0B141A',
  infoText: primitive.steel200,

  // ── Interactive ───────────────────────────────────────────────────────────
  interactive: primitive.amber400,
  interactiveHover: primitive.amber300,
  interactivePressed: primitive.amber600,
  interactiveDisabled: primitive.slate600,

  // ── Icons ─────────────────────────────────────────────────────────────────
  iconPrimary: primitive.slate200,
  iconSecondary: primitive.slate400,
  iconAccent: primitive.amber400,
  iconEmergency: primitive.crimson400,
  iconSafe: primitive.teal400,

  // ── Navigation (bottom tab bar) ───────────────────────────────────────────
  tabBarBackground: primitive.slate900,
  tabBarBorder: primitive.slate800,
  tabBarActive: primitive.amber400,
  tabBarInactive: primitive.slate500,

  // ── Misc ──────────────────────────────────────────────────────────────────
  divider: primitive.slate800,
  overlay: 'rgba(8, 14, 26, 0.85)',
  shimmer1: primitive.slate800,
  shimmer2: primitive.slate700,

  // ── Primitives (escape hatch) ─────────────────────────────────────────────
  white: primitive.white,
  black: primitive.black,
  transparent: primitive.transparent,
} as const;

export const lightColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bgPrimary: primitive.slate50,
  bgSecondary: primitive.white,
  bgElevated: primitive.white,
  bgMuted: primitive.slate100,

  // ── Surfaces ─────────────────────────────────────────────────────────────
  surfacePrimary: primitive.white,
  surfaceSecondary: primitive.slate100,
  surfaceBorder: primitive.slate200,
  surfaceBorderSubtle: primitive.slate100,

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary: primitive.slate900,
  textSecondary: primitive.slate700,
  textTertiary: primitive.slate500,
  textDisabled: primitive.slate400,
  textInverse: primitive.white,

  // ── Brand / Accent ────────────────────────────────────────────────────────
  accent: primitive.amber500,
  accentMuted: primitive.amber300,
  accentSubtle: '#FFFBEB',
  accentText: primitive.amber700,

  // ── Emergency ─────────────────────────────────────────────────────────────
  emergency: primitive.crimson600,
  emergencyMuted: primitive.crimson300,
  emergencySubtle: '#FEF2F2',
  emergencyText: primitive.crimson700,
  emergencyBorder: primitive.crimson300,

  // ── Safe ──────────────────────────────────────────────────────────────────
  safe: primitive.teal600,
  safeMuted: primitive.teal300,
  safeSubtle: '#F0FDFA',
  safeText: primitive.teal700,

  // ── Warning ───────────────────────────────────────────────────────────────
  warning: primitive.amber500,
  warningMuted: primitive.amber300,
  warningSubtle: '#FFFBEB',
  warningText: primitive.amber700,

  // ── Info ──────────────────────────────────────────────────────────────────
  info: primitive.steel500,
  infoMuted: primitive.steel200,
  infoSubtle: '#F0F7FF',
  infoText: primitive.steel700,

  // ── Interactive ───────────────────────────────────────────────────────────
  interactive: primitive.amber500,
  interactiveHover: primitive.amber600,
  interactivePressed: primitive.amber700,
  interactiveDisabled: primitive.slate300,

  // ── Icons ─────────────────────────────────────────────────────────────────
  iconPrimary: primitive.slate700,
  iconSecondary: primitive.slate400,
  iconAccent: primitive.amber500,
  iconEmergency: primitive.crimson600,
  iconSafe: primitive.teal600,

  // ── Navigation ────────────────────────────────────────────────────────────
  tabBarBackground: primitive.white,
  tabBarBorder: primitive.slate200,
  tabBarActive: primitive.amber600,
  tabBarInactive: primitive.slate400,

  // ── Misc ──────────────────────────────────────────────────────────────────
  divider: primitive.slate200,
  overlay: 'rgba(15, 23, 42, 0.6)',
  shimmer1: primitive.slate100,
  shimmer2: primitive.slate200,

  // ── Primitives ────────────────────────────────────────────────────────────
  white: primitive.white,
  black: primitive.black,
  transparent: primitive.transparent,
} as const;

// ─── Night Mode Palette ───────────────────────────────────────────────────────
// Auto-activates after sunset. High-contrast red-and-black.
// Reduces glare while riding at night. Crimson replaces amber as accent.
// Applied via ThemeContext when timeMode === 'night'.

export const nightColors: ColorTokens = {
  // Backgrounds — deeper than dark, near-pure black
  bgPrimary:           '#0A0000',
  bgSecondary:         '#110000',
  bgElevated:          '#1A0505',
  bgMuted:             '#0F0202',

  // Surfaces
  surfacePrimary:      '#1A0505',
  surfaceSecondary:    '#220808',
  surfaceBorder:       '#2E0A0A',
  surfaceBorderSubtle: '#1A0505',

  // Text — slightly warm white to reduce eye strain on OLED
  textPrimary:         '#FFF5F5',
  textSecondary:       '#FFBDBD',
  textTertiary:        '#994444',
  textDisabled:        '#5C2222',
  textInverse:         '#0A0000',

  // Brand / Accent → shifts from amber to crimson at night
  accent:              primitive.crimson400,
  accentMuted:         primitive.crimson800,
  accentSubtle:        '#1F0505',
  accentText:          primitive.crimson300,

  // Emergency — brighter than accent to stay distinct
  emergency:           '#FF2020',
  emergencyMuted:      '#5C0A0A',
  emergencySubtle:     '#180303',
  emergencyText:       '#FF8080',
  emergencyBorder:     '#7A1010',

  // Safe — desaturated teal so it doesn't blind at night
  safe:                '#0D7A70',
  safeMuted:           '#063D38',
  safeSubtle:          '#031210',
  safeText:            '#5EDBCF',

  // Warning
  warning:             '#CC6600',
  warningMuted:        '#5C2A00',
  warningSubtle:       '#180A00',
  warningText:         '#FFAA55',

  // Info
  info:                primitive.steel500,
  infoMuted:           primitive.steel700,
  infoSubtle:          '#080E14',
  infoText:            primitive.steel200,

  // Interactive → crimson at night
  interactive:         primitive.crimson400,
  interactiveHover:    primitive.crimson300,
  interactivePressed:  primitive.crimson600,
  interactiveDisabled: '#5C2222',

  // Icons
  iconPrimary:         '#FFD0D0',
  iconSecondary:       '#994444',
  iconAccent:          primitive.crimson400,
  iconEmergency:       '#FF2020',
  iconSafe:            '#0D7A70',

  // Navigation
  tabBarBackground:    '#0A0000',
  tabBarBorder:        '#1A0505',
  tabBarActive:        primitive.crimson400,
  tabBarInactive:      '#5C2222',

  // Misc
  divider:             '#1A0505',
  overlay:             'rgba(10, 0, 0, 0.90)',
  shimmer1:            '#1A0505',
  shimmer2:            '#220808',

  // Primitives
  white:               primitive.white,
  black:               primitive.black,
  transparent:         primitive.transparent,
} as const;

export type ColorTokens = {
  [K in keyof typeof darkColors]: string;
};

// ─── Gradient Presets ─────────────────────────────────────────────────────────
// Use with expo-linear-gradient. All gradients are design-system approved.

export const gradients = {
  // Hero card — amber glow, dark base
  heroCard: {
    colors: ['#1A1200', '#0F172A'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Amber accent gradient — buttons, highlights
  amber: {
    colors: [primitive.amber400, primitive.amber600] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Emergency gradient — SOS button, crash alert
  emergency: {
    colors: [primitive.crimson500, primitive.crimson700] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Safe / active ride gradient — teal to dark teal
  safe: {
    colors: [primitive.teal500, primitive.teal700] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Dark card gradient — subtle depth
  darkCard: {
    colors: [primitive.slate800, primitive.slate900] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Screen bg gradient — very subtle dark to deepest
  screenBg: {
    colors: [primitive.slate900, primitive.slate950] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Night hero card — deep red-black base
  nightHeroCard: {
    colors: ['#1A0303', '#0A0000'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Night accent gradient — crimson for night mode CTAs
  night: {
    colors: [primitive.crimson500, primitive.crimson800] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // SOS pulse overlay glow (transparent layers)
  sosPulse: {
    colors: [
      'rgba(239, 68, 68, 0.3)',
      'rgba(239, 68, 68, 0.0)',
    ] as const,
    start: { x: 0.5, y: 0.5 },
    end: { x: 1, y: 1 },
  },
} as const;

export type GradientKey = keyof typeof gradients;
