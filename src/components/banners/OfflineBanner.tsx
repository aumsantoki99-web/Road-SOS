/**
 * OfflineBanner — Persistent offline indicator
 *
 * Shown at the top of every screen when the device has no internet.
 * Unlike StatusBanner (which is dismissable), OfflineBanner persists
 * until connectivity is restored — the user should always know they're
 * in offline mode before taking safety-critical actions.
 *
 * States:
 *   offline      → "No internet connection — Emergency mode active"
 *   reconnecting → "Reconnecting..." with subtle pulse
 *   syncing      → "Syncing X pending alerts..."
 *
 * The banner slides in from the top and slides out when online.
 * Height animates smoothly so it doesn't cause layout jumps.
 *
 * Usage:
 *   const { isConnected } = useNetwork(); // feature/offline-mode
 *   <OfflineBanner visible={!isConnected} pendingCount={queue.length} />
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
import { spacing, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

type OfflineState = 'offline' | 'reconnecting' | 'syncing';

export interface OfflineBannerProps {
  visible: boolean;
  state?: OfflineState;
  /** Number of queued alerts waiting to sync */
  pendingCount?: number;
  /** Called when user taps "View" — navigates to OfflineMode screen */
  onViewDetails?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OfflineBanner({
  visible,
  state = 'offline',
  pendingCount = 0,
  onViewDetails,
}: OfflineBannerProps): React.JSX.Element {
  const { colors } = useTheme();
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // ── Show / hide animation ─────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: false, // height cannot use native driver
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, heightAnim, opacityAnim]);

  // ── Reconnecting pulse ────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'reconnecting') {
      dotOpacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [state, dotOpacity]);

  // ── Content ───────────────────────────────────────────────────────────────
  type StateConfig = { icon: keyof typeof Ionicons.glyphMap; message: string; bg: string; border: string; text: string; iconColor: string };
  const stateConfig: Record<OfflineState, StateConfig> = {
    offline: {
      icon: 'cloud-offline',
      message: pendingCount > 0
        ? `Offline — ${pendingCount} alert${pendingCount !== 1 ? 's' : ''} queued`
        : 'No internet — Emergency mode active',
      bg:        colors.warningSubtle,
      border:    colors.warningMuted,
      text:      colors.warningText,
      iconColor: colors.warning,
    },
    reconnecting: {
      icon:      'reload',
      message:   'Reconnecting...',
      bg:        colors.infoSubtle,
      border:    colors.infoMuted,
      text:      colors.infoText,
      iconColor: colors.info,
    },
    syncing: {
      icon:      'cloud-upload',
      message:   `Syncing ${pendingCount} pending alert${pendingCount !== 1 ? 's' : ''}...`,
      bg:        colors.safeSubtle,
      border:    colors.safeMuted,
      text:      colors.safeText,
      iconColor: colors.safe,
    },
  };

  const config = stateConfig[state];

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  return (
    <Animated.View style={[{ maxHeight, overflow: 'hidden' }]}>
      <Animated.View
        style={[
          styles.banner,
          {
            backgroundColor: config.bg,
            borderBottomColor: config.border,
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Status dot */}
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: config.iconColor, opacity: dotOpacity },
          ]}
        />

        {/* Icon */}
        <Ionicons name={config.icon} size={14} color={config.iconColor} style={styles.icon} />

        {/* Message */}
        <Text
          style={[textStyles.bodySmall, { color: config.text, flex: 1 }]}
          numberOfLines={1}
        >
          {config.message}
        </Text>

        {/* View details link */}
        {onViewDetails !== undefined && state === 'offline' && (
          <TouchableOpacity
            onPress={onViewDetails}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="View offline details"
          >
            <Text style={[textStyles.labelMedium, { color: config.iconColor }]}>
              View
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    gap: spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  icon: {
    flexShrink: 0,
  },
});
