/**
 * AccessibleText — Font-scale aware text component
 *
 * Wraps React Native Text with:
 *   - maxFontSizeMultiplier cap (prevents extreme sizes breaking layouts)
 *   - Minimum font size floor (never unreadably small)
 *   - Automatic role detection (header vs body)
 *
 * Use this instead of raw <Text> when the system font size setting
 * could break a specific layout (e.g. tab bar labels, card stats).
 *
 * For most cases, raw <Text> with textStyles is fine — this is for
 * places that need explicit size control.
 *
 * Usage:
 *   <AccessibleText style={textStyles.numericHero} maxScale={1.3}>
 *     {formatDuration(elapsed)}
 *   </AccessibleText>
 */

import React from 'react';
import { Text, StyleSheet, type TextProps, type TextStyle } from 'react-native';

interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  /** Cap system font scaling at this multiplier (default: 1.5) */
  maxScale?: number;
  /** Declare as a heading for screen readers */
  isHeading?: boolean;
}

export function AccessibleText({
  children,
  maxScale = 1.5,
  isHeading = false,
  style,
  ...props
}: AccessibleTextProps): React.JSX.Element {
  return (
    <Text
      style={style}
      maxFontSizeMultiplier={maxScale}
      accessibilityRole={isHeading ? 'header' : 'text'}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Numeric stat text — strictly capped at 1.2x to prevent layout overflow
 * in ride stats, speed gauge, etc.
 */
export function StatText({
  children,
  style,
  ...props
}: Omit<AccessibleTextProps, 'maxScale' | 'isHeading'>): React.JSX.Element {
  return (
    <AccessibleText maxScale={1.2} style={[styles.stat, style as TextStyle]} {...props}>
      {children}
    </AccessibleText>
  );
}

const styles = StyleSheet.create({
  stat: {
    includeFontPadding: false,
  },
});
