/**
 * ToggleSwitch — Animated on/off toggle
 *
 * Uses Animated API for a smooth thumb slide — feels native on both
 * iOS and Android without depending on the platform's own switch
 * (which looks inconsistent across OS versions).
 *
 * Track color: accent (amber) when ON, muted surface when OFF.
 * Thumb: white circle, casts a subtle shadow for depth.
 *
 * Usage:
 *   <ToggleSwitch value={enabled} onValueChange={setEnabled} />
 *   <ToggleSwitch value={darkMode} onValueChange={toggleTheme} label="Dark Mode" />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4; // 4px padding each side

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  /** Sublabel shown below the label */
  description?: string;
  accessibilityLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  label,
  description,
  accessibilityLabel,
}: ToggleSwitchProps): React.JSX.Element {
  const { colors } = useTheme();

  const thumbPosition = useRef(new Animated.Value(value ? THUMB_TRAVEL : 0)).current;
  const trackOpacity = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(thumbPosition, {
        toValue: value ? THUMB_TRAVEL : 0,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
      Animated.timing(trackOpacity, {
        toValue: value ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value, thumbPosition, trackOpacity]);

  function handlePress(): void {
    if (!disabled) {
      onValueChange(!value);
    }
  }

  return (
    <View style={[styles.wrapper, { opacity: disabled ? 0.45 : 1 }]}>
      {/* Label block */}
      {(label !== undefined || description !== undefined) && (
        <View style={styles.labelBlock}>
          {label !== undefined && (
            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>
              {label}
            </Text>
          )}
          {description !== undefined && (
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: 2 }]}>
              {description}
            </Text>
          )}
        </View>
      )}

      {/* Track + Thumb */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Toggle'}
        accessibilityState={{ checked: value, disabled }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
          {/* Active fill overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.trackFill,
              { backgroundColor: colors.accent, opacity: trackOpacity },
            ]}
          />
          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              shadows.sm,
              { backgroundColor: colors.white },
              { transform: [{ translateX: thumbPosition }] },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  labelBlock: {
    flex: 1,
    marginRight: spacing[4],
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  trackFill: {
    borderRadius: radius.full,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
  },
});
