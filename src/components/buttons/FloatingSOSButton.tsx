/**
 * FloatingSOSButton — Hero SOS emergency button
 * feature/accessibility ✅ — screen reader, role, live region
 *
 * Three concentric pulse rings + crimson gradient core.
 * The most accessible element in the app — must be reachable
 * with VoiceOver / TalkBack at all times.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gradients } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

const CORE_SIZE   = 100;
const RING_1_SIZE = 136;
const RING_2_SIZE = 172;
const RING_3_SIZE = 208;

export interface FloatingSOSButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

interface PulseRingProps {
  size: number;
  delay: number;
  color: string;
  paused: boolean;
}

function PulseRing({ size, delay, color, paused }: PulseRingProps): React.JSX.Element {
  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (paused) {
      animRef.current?.stop();
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.85, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5,  duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,    duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.85, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5,  duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    animRef.current.start();
    return () => animRef.current?.stop();
  }, [paused, delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
      // Decorative — hidden from screen readers
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

export function FloatingSOSButton({
  onPress,
  disabled = false,
}: FloatingSOSButtonProps): React.JSX.Element {
  const { colors, isNight } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const ringColor      = colors.emergency;
  const gradientColors = isNight ? gradients.night.colors : gradients.emergency.colors;

  // Respect system Reduce Motion — pause all decorative pulse rings
  const ringsPaused = disabled || prefersReducedMotion;

  function handlePressIn(): void {
    Animated.spring(buttonScale, {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 80,
      bounciness: 0,
    }).start();
  }

  function handlePressOut(): void {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  }

  function handlePress(): void {
    // Announce to screen reader
    AccessibilityInfo.announceForAccessibility(
      'SOS confirmation screen opening. You have 10 seconds to cancel.',
    );
    onPress();
  }

  return (
    <View
      style={styles.container}
      // Group the whole button as one accessible element
      accessible
      accessibilityRole="button"
      accessibilityLabel="SOS Emergency Button"
      accessibilityHint="Opens emergency alert confirmation. Alert sends automatically after 10 seconds."
      accessibilityState={{ disabled }}
    >
      {/* Decorative pulse rings — hidden from assistive tech */}
      <PulseRing size={RING_3_SIZE} delay={400}  color={ringColor} paused={ringsPaused} />
      <PulseRing size={RING_2_SIZE} delay={200}  color={ringColor} paused={ringsPaused} />
      <PulseRing size={RING_1_SIZE} delay={0}    color={ringColor} paused={ringsPaused} />

      <Animated.View
        style={[
          styles.coreWrapper,
          shadows.glowEmergency,
          { transform: [{ scale: buttonScale }] },
        ]}
        // Inner button is not independently focusable — parent View handles it
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <TouchableOpacity
          onPress={disabled ? undefined : handlePress}
          onPressIn={disabled ? undefined : handlePressIn}
          onPressOut={disabled ? undefined : handlePressOut}
          activeOpacity={1}
          disabled={disabled}
          style={styles.core}
        >
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
          <Ionicons name="shield-checkmark" size={22} color="rgba(255,255,255,0.85)" />
          <Text style={styles.sosLabel}>SOS</Text>
          <Text style={styles.sosSubLabel}>TAP FOR HELP</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_3_SIZE,
    height: RING_3_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    // Ensure minimum touch target is well exceeded
    minWidth: RING_3_SIZE,
    minHeight: RING_3_SIZE,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  coreWrapper: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    lineHeight: 24,
  },
  sosSubLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
