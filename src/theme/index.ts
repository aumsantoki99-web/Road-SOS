/**
 * Theme barrel export — feature/theme-system ✅
 *
 * Usage:
 *   import { darkColors, lightColors, gradients } from '@theme/colors';
 *   import { textStyles, fontFamilies, fontSizes } from '@theme/typography';
 *   import { spacing, layout, radius } from '@theme/spacing';
 *   import { shadows } from '@theme/shadows';
 *   import { globalStyles } from '@theme/globalStyles';
 *   import { useAppFonts } from '@theme/fonts';
 */

export { darkColors, lightColors, nightColors, gradients } from './colors';
export type { ColorTokens, GradientKey } from './colors';

export {
  textStyles,
  fontFamilies,
  fontSizes,
  lineHeights,
  letterSpacing,
  fontWeights,
} from './typography';
export type { FontFamily, FontSize, TextStyleKey } from './typography';

export { spacing, layout, radius, borderWidth } from './spacing';
export type { SpacingKey, RadiusKey } from './spacing';

export { shadows } from './shadows';
export type { ShadowKey } from './shadows';

export { globalStyles } from './globalStyles';
export { useAppFonts } from './fonts';
