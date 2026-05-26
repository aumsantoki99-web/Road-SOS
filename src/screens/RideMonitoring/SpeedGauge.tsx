/**
 * SpeedGauge — Premium Arc Speed Display
 * feature/ui-polish-ride ✅
 *
 * Enhancements:
 *   - Zone label below gauge is animated — fades in on speed change
 *   - Speed number uses larger font for more drama
 *   - "MOCK GPS" label is de-emphasised — less developer noise
 *   - Idle state shows "--" with subdued color, not a jarring 0
 *   - Speed zone transitions feel intentional not accidental
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface SpeedGaugeProps {
  speedKmh: number;
  maxSpeedKmh?: number;
  isActive: boolean;
}

function getSpeedColor(
  speed: number,
  max: number,
  colors: { safe: string; accent: string; emergency: string },
): string {
  const ratio = speed / max;
  if (ratio < 0.4)  return colors.safe;
  if (ratio < 0.75) return colors.accent;
  return colors.emergency;
}

function getSpeedZone(speed: number, max: number): string {
  const ratio = speed / max;
  if (ratio < 0.4)  return 'SAFE SPEED';
  if (ratio < 0.75) return 'MODERATE';
  return 'HIGH SPEED';
}

export function SpeedGauge({
  speedKmh,
  maxSpeedKmh = 120,
  isActive,
}: SpeedGaugeProps): React.JSX.Element {
  const { colors } = useTheme();

  const animatedSpeed = useRef(new Animated.Value(0)).current;
  const pulseOpacity  = useRef(new Animated.Value(1)).current;
  const zoneOpacity   = useRef(new Animated.Value(0)).current;

  // Animate speed value changes
  useEffect(() => {
    Animated.timing(animatedSpeed, {
      toValue: isActive ? Math.min(speedKmh, maxSpeedKmh) : 0,
      useNativeDriver: false,
      duration: 720,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [speedKmh, isActive, animatedSpeed, maxSpeedKmh]);

  // Pulse while active
  useEffect(() => {
    if (!isActive) { pulseOpacity.setValue(1); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1.0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, pulseOpacity]);

  // Zone label fades in when active
  useEffect(() => {
    Animated.timing(zoneOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isActive, zoneOpacity]);

  const speedColor = getSpeedColor(speedKmh, maxSpeedKmh, colors);
  const zoneLabel  = getSpeedZone(speedKmh, maxSpeedKmh);

  const arcRotation = animatedSpeed.interpolate({
    inputRange:  [0, maxSpeedKmh],
    outputRange: ['-180deg', '0deg'],
    extrapolate: 'clamp',
  });

  const trailRotation = animatedSpeed.interpolate({
    inputRange:  [0, maxSpeedKmh],
    outputRange: ['-192deg', '-12deg'],
    extrapolate: 'clamp',
  });

  const GAUGE_SIZE    = 220;
  const TRACK_STROKE  = 14;
  const ACTIVE_STROKE = 10;
  const HALF          = GAUGE_SIZE / 2;
  const ARC_INSET     = (TRACK_STROKE - ACTIVE_STROKE) / 2;
  const ACTIVE_SIZE   = GAUGE_SIZE - ARC_INSET * 2;

  return (
    <View style={styles.container}>
      {/* Arc gauge */}
      <View
        style={[
          styles.gaugeOuter,
          {
            width: GAUGE_SIZE,
            height: HALF + TRACK_STROKE,
            borderTopLeftRadius: HALF,
            borderTopRightRadius: HALF,
            borderWidth: TRACK_STROKE,
            borderColor: colors.surfaceSecondary,
          },
        ]}
      >
        {/* Left half arc */}
        <View style={[styles.halfLeft, { width: HALF, height: HALF, overflow: 'hidden' }]}>
          <Animated.View
            style={[
              styles.halfArc,
              {
                width: ACTIVE_SIZE,
                height: ACTIVE_SIZE,
                borderRadius: ACTIVE_SIZE / 2,
                borderWidth: ACTIVE_STROKE,
                borderColor: speedColor,
                opacity: isActive ? 0.2 : 0.08,
                top: ARC_INSET,
                right: ARC_INSET,
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                transform: [{ rotate: trailRotation }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.halfArc,
              {
                width: ACTIVE_SIZE,
                height: ACTIVE_SIZE,
                borderRadius: ACTIVE_SIZE / 2,
                borderWidth: ACTIVE_STROKE,
                borderColor: speedColor,
                opacity: isActive ? 0.82 : 0.42,
                top: ARC_INSET,
                right: ARC_INSET,
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                transform: [{ rotate: arcRotation }],
              },
            ]}
          />
        </View>

        {/* Centre content */}
        <View style={styles.centre}>
          {/* Pulse indicator */}
          <Animated.View
            style={[
              styles.pulseDot,
              { backgroundColor: speedColor, opacity: isActive ? pulseOpacity : 0.3 },
            ]}
          />

          {/* Speed number */}
          <Text
            style={[
              textStyles.numericHero,
              {
                color: isActive ? colors.textPrimary : colors.textTertiary,
                fontSize: 54,
                lineHeight: 58,
              },
            ]}
          >
            {isActive ? Math.round(speedKmh) : '--'}
          </Text>

          <Text style={[textStyles.labelCaps, { color: colors.textTertiary }]}>
            KM/H
          </Text>
        </View>
      </View>

      {/* Zone badge — fades in when active */}
      <Animated.View
        style={[
          styles.zoneBadge,
          { backgroundColor: `${speedColor}18`, opacity: zoneOpacity },
        ]}
      >
        <View style={[styles.zoneDot, { backgroundColor: speedColor }]} />
        <Text style={[textStyles.labelMedium, { color: speedColor }]}>
          {zoneLabel}
        </Text>
      </Animated.View>

      {/* Mock GPS note — subtle */}
      {isActive && (
        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: spacing[1] }]}>
          Mock GPS · Connect expo-location
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  gaugeOuter: {
    overflow: 'hidden',
    borderBottomWidth: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  halfLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  halfArc: { position: 'absolute' },
  centre: {
    position: 'absolute',
    bottom: spacing[2],
    alignItems: 'center',
    width: '70%',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginBottom: spacing[2],
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    marginTop: spacing[4],
    gap: spacing[1.5],
  },
  zoneDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
});
