/**
 * Font Loading — expo-font
 *
 * Loads Syne (display) and DM Sans (UI) from Google Fonts via @expo-google-fonts.
 *
 * ⚠️  Install required packages:
 *   npx expo install @expo-google-fonts/syne @expo-google-fonts/dm-sans
 *
 * Usage in App.tsx:
 *   import { useFonts, fontsLoaded } from '@theme/fonts';
 *   const [loaded] = useFonts();
 *   if (!loaded) return null;
 *
 * Note: We define the font map here but load via expo-font's useFonts hook.
 * The actual font objects are imported from the @expo-google-fonts packages.
 */

// ─── Font map ─────────────────────────────────────────────────────────────────
// Keys must match fontFamilies in typography.ts exactly.

/**
 * Font asset map for expo-font's useFonts hook.
 *
 * TODO: Uncomment and install @expo-google-fonts packages when ready.
 *
 * npx expo install @expo-google-fonts/syne @expo-google-fonts/dm-sans
 *
 * Then replace this file with:
 *
 * ```ts
 * import {
 *   Syne_600SemiBold,
 *   Syne_700Bold,
 * } from '@expo-google-fonts/syne';
 * import {
 *   DMSans_400Regular,
 *   DMSans_500Medium,
 *   DMSans_600SemiBold,
 *   DMSans_700Bold,
 * } from '@expo-google-fonts/dm-sans';
 * import { useFonts } from 'expo-font';
 *
 * export const fontAssets = {
 *   Syne_700Bold,
 *   Syne_600SemiBold,
 *   DMSans_400Regular,
 *   DMSans_500Medium,
 *   DMSans_600SemiBold,
 *   DMSans_700Bold,
 * };
 *
 * export function useAppFonts() {
 *   return useFonts(fontAssets);
 * }
 * ```
 */

// ─── System font fallbacks (used until @expo-google-fonts are installed) ──────

export const systemFontFallbacks = {
  Syne_700Bold: undefined,
  Syne_600SemiBold: undefined,
  DMSans_400Regular: undefined,
  DMSans_500Medium: undefined,
  DMSans_600SemiBold: undefined,
  DMSans_700Bold: undefined,
} as const;

/**
 * Temporary hook — returns [true] so app renders without font packages.
 * Replace with the real useFonts call above once packages are installed.
 */
export function useAppFonts(): [boolean] {
  // TODO: Replace with real font loading once @expo-google-fonts are installed
  return [true];
}
