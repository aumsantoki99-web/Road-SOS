/**
 * StatusBanner — Inline status strip
 *
 * Communicates system state at a glance without blocking content.
 * Sits just below the AppHeader or at the top of a section.
 *
 * Variants:
 *   safe    → Teal — "Safe Ride Active", "All contacts reachable"
 *   warning → Amber — "Low GPS signal", "1 contact unreachable"
 *   danger  → Crimson — "Crash detected", "SOS sent"
 *   info    → Steel — "Syncing...", "Offline mode active"
 *
 * Features:
 *   - Left icon + message
 *   - Optional right action button
 *   - Optional dismiss (×)
 *   - Slides in from top on mount
 *
 * Usage:
 *   <StatusBanner variant="safe" message="Safe Ride Active" icon="shield-checkmark" />
 *   <StatusBanner variant="danger" message="Crash Detected" action={{ label: 'View', onPress }} />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BannerVariant = 'safe' | 'warning' | 'danger' | 'info';

interface BannerAction {
  label: string;
  onPress: () => void;
}

export interface StatusBannerProps {
  variant: BannerVariant;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: BannerAction;
  onDismiss?: () => void;
  /** Skip the slide-in animation */
  noAnimation?: boolean;
}

// ─── Default icons per variant ────────────────────────────────────────────────

const DEFAULT_ICONS: Record<BannerVariant, keyof typeof Ionicons.glyphMap> = {
  safe:    'shield-checkmark',
  warning: 'warning',
  danger:  'alert-circle',
  info:    'information-circle',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusBanner({
  variant,
  message,
  icon,
  action,
  onDismiss,
  noAnimation = false,
}: StatusBannerProps): React.JSX.Element {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(noAnimation ? 0 : -20)).current;
  const opacity = useRef(new Animated.Value(noAnimation ? 1 : 0)).current;

  useEffect(() => {
    if (noAnimation) return;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [noAnimation, translateY, opacity]);

  // ── Color map ──────────────────────────────────────────────────────────────
  type ColorSet = { bg: string; border: string; text: string; icon: string };
  const colorMap: Record<BannerVariant, ColorSet> = {
    safe: {
      bg:     colors.safeSubtle,
      border: colors.safeMuted,
      text:   colors.safeText,
      icon:   colors.safe,
    },
    warning: {
      bg:     colors.warningSubtle,
      border: colors.warningMuted,
      text:   colors.warningText,
      icon:   colors.warning,
    },
    danger: {
      bg:     colors.emergencySubtle,
      border: colors.emergencyBorder,
      text:   colors.emergencyText,
      icon:   colors.emergency,
    },
    info: {
      bg:     colors.infoSubtle,
      border: colors.infoMuted,
      text:   colors.infoText,
      icon:   colors.info,
    },
  };

  const c = colorMap[variant];
  const resolvedIcon = icon ?? DEFAULT_ICONS[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {/* Icon */}
      <Ionicons name={resolvedIcon} size={16} color={c.icon} style={styles.iconLeft} />

      {/* Message */}
      <Text
        style={[textStyles.bodySmall, { color: c.text, flex: 1 }]}
        numberOfLines={2}
      >
        {message}
      </Text>

      {/* Action */}
      {action !== undefined && (
        <TouchableOpacity
          onPress={action.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={[textStyles.labelMedium, { color: c.icon, marginLeft: spacing[3] }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Dismiss */}
      {onDismiss !== undefined && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.dismissBtn}
        >
          <Ionicons name="close" size={14} color={c.text} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    minHeight: layout.minTouchTarget,
  },
  iconLeft: {
    marginRight: spacing[2],
    flexShrink: 0,
  },
  dismissBtn: {
    marginLeft: spacing[2],
    flexShrink: 0,
  },
});
