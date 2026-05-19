/**
 * RideSafe Global Styles
 *
 * Reusable StyleSheet patterns used across all screens.
 * Import from @theme — never copy-paste these into components.
 *
 * These are theme-AGNOSTIC (no color references).
 * Color-dependent styles live in components, using the ThemeContext.
 */

import { StyleSheet } from 'react-native';
import { spacing, radius, layout, borderWidth } from './spacing';

export const globalStyles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexRowCenter: { flexDirection: 'row', alignItems: 'center' },
  flexRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexRowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerVertical: { justifyContent: 'center' },
  centerHorizontal: { alignItems: 'center' },

  // ── Screen containers ────────────────────────────────────────────────────
  screen: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: layout.screenHorizontal,
  },
  screenContentTop: {
    flex: 1,
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: layout.screenVerticalTop,
  },

  // ── Cards ────────────────────────────────────────────────────────────────
  card: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: radius.md,
    padding: layout.cardPaddingCompact,
    overflow: 'hidden',
  },
  cardBorder: {
    borderWidth: borderWidth.thin,
    borderRadius: radius.lg,
  },

  // ── Dividers ─────────────────────────────────────────────────────────────
  divider: {
    height: borderWidth.hairline,
    width: '100%',
  },
  dividerVertical: {
    width: borderWidth.hairline,
    alignSelf: 'stretch',
  },

  // ── Touch targets ─────────────────────────────────────────────────────────
  /** Minimum 44pt touch target — Apple HIG */
  touchTarget: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Absolute positioning ─────────────────────────────────────────────────
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  absoluteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Gaps (React Native 0.71+ gap support) ────────────────────────────────
  gapXs: { gap: spacing[1] },
  gapSm: { gap: spacing[2] },
  gapMd: { gap: spacing[3] },
  gapLg: { gap: spacing[4] },
  gapXl: { gap: spacing[6] },

  // ── Common paddings ───────────────────────────────────────────────────────
  pSm: { padding: spacing[2] },
  pMd: { padding: spacing[4] },
  pLg: { padding: spacing[6] },
  pxSm: { paddingHorizontal: spacing[2] },
  pxMd: { paddingHorizontal: spacing[4] },
  pxLg: { paddingHorizontal: layout.screenHorizontal },
  pySm: { paddingVertical: spacing[2] },
  pyMd: { paddingVertical: spacing[4] },
  pyLg: { paddingVertical: spacing[6] },

  // ── Common margins ────────────────────────────────────────────────────────
  mtSm: { marginTop: spacing[2] },
  mtMd: { marginTop: spacing[4] },
  mtLg: { marginTop: spacing[6] },
  mbSm: { marginBottom: spacing[2] },
  mbMd: { marginBottom: spacing[4] },
  mbLg: { marginBottom: spacing[6] },

  // ── Overflow ─────────────────────────────────────────────────────────────
  overflowHidden: { overflow: 'hidden' },

  // ── Input field base ─────────────────────────────────────────────────────
  inputBase: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    borderWidth: borderWidth.thin,
    fontSize: 16,
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    alignSelf: 'flex-start',
  },

  // ── Pill / Tag ────────────────────────────────────────────────────────────
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
});
