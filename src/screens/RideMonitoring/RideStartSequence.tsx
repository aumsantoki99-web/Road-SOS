/**
 * RideStartSequence — Animated Ride Activation Overlay
 *
 * Shows a 3-step checklist animation before ride begins:
 *   1. GPS Ready
 *   2. Crash Detection On
 *   3. Contacts Notified
 *
 * Creates a sense of the app "powering up" — makes users feel safe.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

const STEPS = [
  { icon: 'location',          label: 'GPS Ready',           delay: 400  },
  { icon: 'shield-checkmark',  label: 'Crash Detection On',  delay: 800  },
  { icon: 'people',            label: 'Contacts Notified',   delay: 1200 },
];

interface RideStartSequenceProps {
  visible: boolean;
  onComplete: () => void;
}

function CheckStep({
  icon,
  label,
  delay,
  onComplete,
}: {
  icon: string;
  label: string;
  delay: number;
  onComplete?: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideX  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
        Animated.timing(opacity,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideX,  { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
      ]).start(() => onComplete?.());
    }, delay);
    return () => clearTimeout(timer);
  }, [scale, opacity, slideX, delay, onComplete]);

  return (
    <Animated.View
      style={[
        styles.checkStep,
        { opacity, transform: [{ translateX: slideX }] },
      ]}
    >
      <Animated.View
        style={[
          styles.checkIcon,
          { backgroundColor: colors.safeSubtle, transform: [{ scale }] },
        ]}
      >
        <Ionicons name={icon as 'location'} size={20} color={colors.safe} />
      </Animated.View>
      <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>
        {label}
      </Text>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name="checkmark-circle" size={20} color={colors.safe} />
      </Animated.View>
    </Animated.View>
  );
}

export function RideStartSequence({
  visible,
  onComplete,
}: RideStartSequenceProps): React.JSX.Element {
  const { colors } = useTheme();
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Fade in
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Fade out and call onComplete after all steps
    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onComplete());
    }, 1800);

    return () => clearTimeout(timer);
  }, [visible, overlayOpacity, onComplete]);

  if (!visible) return <></>;

  return (
    <Modal transparent visible={visible} statusBarTranslucent animationType="none">
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: colors.overlay }]}
      >
        <View style={[styles.card, { backgroundColor: colors.bgElevated }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.headerIcon, { backgroundColor: colors.safeSubtle }]}>
              <Ionicons name="shield" size={24} color={colors.safe} />
            </View>
            <Text style={[textStyles.headingMedium, { color: colors.textPrimary, marginTop: spacing[4] }]}>
              Activating safety monitoring
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              RideSafe is powering up...
            </Text>
          </View>

          {/* Steps */}
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <CheckStep
                key={s.label}
                icon={s.icon}
                label={s.label}
                delay={s.delay}
                onComplete={i === STEPS.length - 1 ? onComplete : undefined}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  card: {
    width: '100%',
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
  },
  cardHeader: { alignItems: 'center', marginBottom: spacing[6] },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { width: '100%', gap: spacing[3] },
  checkStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
