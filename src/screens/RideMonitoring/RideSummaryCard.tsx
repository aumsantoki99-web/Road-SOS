/**
 * RideSummaryCard — Post-Ride Celebration Card
 * feature/ui-polish-ride ✅
 *
 * Enhancements:
 *   - Spring slide-up entrance — feels earned, not abrupt
 *   - Safe ride header uses green gradient — positive reinforcement
 *   - Three stat cells with large numeric display
 *   - Subtle "You rode safely" copy reinforces trust
 *   - Primary CTA (new ride) full width, secondary (done) ghost
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { CustomButton } from '../../components/common/CustomButton';
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDuration, formatDistance } from '../../utils';
import type { RideSession } from '../../types';

interface RideSummaryCardProps {
  session: RideSession;
  onDismiss: () => void;
  onNewRide: () => void;
}

export function RideSummaryCard({
  session,
  onDismiss,
  onNewRide,
}: RideSummaryCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const slideY  = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideY, opacity]);

  const isSafe = !session.crashDetected;
  const durationSecs = session.endTime
    ? Math.floor((session.endTime - session.startTime) / 1000)
    : 0;

  const headerGradientColors: [string, string] = isSafe
    ? [colors.safeMuted, colors.safeSubtle]
    : [colors.emergencyMuted, colors.emergencySubtle];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: isSafe ? colors.safeMuted : colors.emergencyBorder,
        },
        shadows.float,
        { transform: [{ translateY: slideY }], opacity },
      ]}
    >
      {/* ── Gradient header ──────────────────────────────────────────── */}
      <View style={[styles.header, { overflow: 'hidden' }]}>
        <LinearGradient
          colors={headerGradientColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[styles.headerIcon, { backgroundColor: isSafe ? colors.safe : colors.emergency }]}>
          <Ionicons
            name={isSafe ? 'shield-checkmark' : 'warning'}
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.headingMedium, { color: colors.textPrimary }]}>
            {isSafe ? 'Safe Ride Complete' : 'Ride Ended'}
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {isSafe ? 'No incidents detected · Well done' : 'Check your ride data below'}
          </Text>
        </View>
      </View>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <View style={[styles.statsRow, { borderBottomColor: colors.divider }]}>
        {[
          { value: formatDuration(durationSecs), label: 'DURATION' },
          { value: formatDistance(session.distanceKm ?? 0), label: 'DISTANCE' },
          { value: `${Math.round(session.avgSpeedKmh ?? 0)}`, label: 'AVG KM/H' },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={[
              styles.statCell,
              i > 0 && { borderLeftWidth: borderWidth.hairline, borderLeftColor: colors.divider },
            ]}
          >
            <Text style={[textStyles.numericLarge, { color: colors.textPrimary }]}>
              {stat.value}
            </Text>
            <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[1] }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Crash status row ─────────────────────────────────────────── */}
      <View style={styles.crashRow}>
        <View style={[styles.crashDot, { backgroundColor: isSafe ? colors.safe : colors.emergency }]} />
        <Text style={[textStyles.bodySmall, { color: colors.textSecondary }]}>
          {isSafe ? 'No crash events detected' : 'Crash detected during ride'}
        </Text>
        <View style={[styles.crashBadge, { backgroundColor: isSafe ? colors.safeSubtle : colors.emergencySubtle }]}>
          <Text style={[textStyles.caption, { color: isSafe ? colors.safeText : colors.emergencyText, fontWeight: '800' }]}>
            {isSafe ? 'SAFE' : 'CRASH'}
          </Text>
        </View>
      </View>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <CustomButton
          label="Start New Ride"
          onPress={onNewRide}
          variant="primary"
          size="lg"
          fullWidth
          iconLeft="speedometer"
        />
        <View style={{ height: spacing[2] }} />
        <CustomButton
          label="Done"
          onPress={onDismiss}
          variant="ghost"
          size="md"
          fullWidth
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    gap: spacing[3],
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: borderWidth.hairline,
    paddingVertical: spacing[4],
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  crashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  crashDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  crashBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  actions: {
    padding: spacing[5],
    paddingTop: spacing[2],
  },
});
