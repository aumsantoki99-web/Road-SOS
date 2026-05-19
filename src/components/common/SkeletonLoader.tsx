/**
 * SkeletonLoader — Shimmer loading placeholder
 * feature/animations ✅
 *
 * Replaces content while data is loading.
 * Uses Animated opacity pulse — looks like content is glowing in.
 *
 * Usage:
 *   {isLoading ? <SkeletonLoader lines={3} /> : <ContactCard ... />}
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { useShimmer } from '../../hooks/useAnimation';
import { spacing, radius } from '../../theme/spacing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
}

function SkeletonLine({ width = '100%', height = 16 }: SkeletonLineProps): React.JSX.Element {
  const { colors } = useTheme();
  const { opacity, start } = useShimmer(1200);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!prefersReducedMotion) start();
  }, [start, prefersReducedMotion]);

  return (
    <Animated.View
      style={[
        styles.line,
        {
          width,
          height,
          backgroundColor: colors.shimmer1,
          opacity: prefersReducedMotion ? 0.5 : opacity,
        },
      ]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

export interface SkeletonLoaderProps {
  /** Number of text lines to render */
  lines?: number;
  /** Show a circle avatar at the left (for contact-style cards) */
  showAvatar?: boolean;
}

export function SkeletonLoader({
  lines = 2,
  showAvatar = false,
}: SkeletonLoaderProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {showAvatar && (
        <View style={styles.row}>
          <SkeletonLine width={48} height={48} />
          <View style={styles.linesBlock}>
            <SkeletonLine width="70%" height={14} />
            <View style={{ height: spacing[2] }} />
            <SkeletonLine width="45%" height={12} />
          </View>
        </View>
      )}
      {!showAvatar &&
        Array.from({ length: lines }).map((_, i) => (
          <View key={i} style={{ marginBottom: i < lines - 1 ? spacing[2] : 0 }}>
            <SkeletonLine width={i === lines - 1 ? '65%' : '100%'} />
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  linesBlock: {
    flex: 1,
  },
  line: {
    borderRadius: radius.sm,
  },
});
