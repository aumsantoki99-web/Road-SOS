/**
 * RideStatusCard — Live Ride State Display
 *
 * The most information-dense card in the app.
 * Shows the full current ride state in one glance.
 *
 * States:
 *   idle    → "Ready to ride" — subtle, inviting
 *   active  → Teal gradient, pulsing "SAFE" badge, live stats
 *   paused  → Amber, paused indicator
 *   ended   → Muted, shows summary stats
 *
 * Usage:
 *   <RideStatusCard
 *     status="active"
 *     durationSeconds={342}
 *     speedKmh={38}
 *     distanceKm={2.1}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { gradients } from '../../theme/colors';
import { formatDuration, formatDistance } from '../../utils';
import type { RideStatus } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RideStatusCardProps {
  status: RideStatus;
  durationSeconds?: number;
  speedKmh?: number;
  distanceKm?: number;
  /** crash detection placeholder — never implement real logic here */
  crashDetected?: boolean;
}

// ─── Safe badge (pulsing while active) ───────────────────────────────────────

function SafeBadge(): React.JSX.Element {
  const { colors } = useTheme();
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseOpacity]);

  return (
    <Animated.View
      style={[styles.safeBadge, { backgroundColor: colors.safeSubtle, opacity: pulseOpacity }]}
    >
      <Ionicons name="shield-checkmark" size={12} color={colors.safe} />
      <Text style={[textStyles.labelCaps, { color: colors.safe, marginLeft: spacing[1] }]}>
        SAFE
      </Text>
    </Animated.View>
  );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  value,
  unit,
  label,
  light,
}: {
  value: string;
  unit?: string;
  label: string;
  light?: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  const textColor = light ? 'rgba(255,255,255,0.95)' : colors.textPrimary;
  const subColor = light ? 'rgba(255,255,255,0.55)' : colors.textTertiary;

  return (
    <View style={styles.statCell}>
      <View style={styles.statValueRow}>
        <Text style={[textStyles.numericLarge, { color: textColor }]}>{value}</Text>
        {unit !== undefined && (
          <Text style={[textStyles.labelCaps, { color: subColor, marginLeft: 3, alignSelf: 'flex-end', marginBottom: 3 }]}>
            {unit}
          </Text>
        )}
      </View>
      <Text style={[textStyles.caption, { color: subColor, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RideStatusCard({
  status,
  durationSeconds = 0,
  speedKmh = 0,
  distanceKm = 0,
  crashDetected = false, // mock only — never real
}: RideStatusCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const isActive = status === 'active';
  const isPaused = status === 'paused';
  const isEnded  = status === 'ended';

  const formattedTime = formatDuration(durationSeconds);
  const formattedDist = formatDistance(distanceKm);

  // ── Idle state ─────────────────────────────────────────────────────────

  if (status === 'idle') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.surfaceBorder,
          },
          shadows.card,
        ]}
      >
        <View style={styles.idleContent}>
          <View style={[styles.idleIcon, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="shield-outline" size={layout.iconLg} color={colors.textTertiary} />
          </View>
          <View style={styles.idleText}>
            <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]}>
              Ready to ride
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: 2 }]}>
              Start a ride to enable safety monitoring
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Active state — gradient card ───────────────────────────────────────

  if (isActive) {
    return (
      <View style={[styles.card, shadows.glowSafe]}>
        <LinearGradient
          colors={gradients.safe.colors}
          start={gradients.safe.start}
          end={gradients.safe.end}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />
        <View style={styles.activeHeader}>
          <SafeBadge />
          {/* Crash placeholder — mock only */}
          {crashDetected && (
            <View style={[styles.crashBadge, { backgroundColor: colors.emergency }]}>
              <Text style={[textStyles.labelCaps, { color: colors.white }]}>CRASH DETECTED</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <StatCell value={formattedTime} label="Duration" light />
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <StatCell value={String(Math.round(speedKmh))} unit="km/h" label="Speed" light />
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <StatCell value={formattedDist} label="Distance" light />
        </View>
      </View>
    );
  }

  // ── Paused / Ended state ───────────────────────────────────────────────

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: isPaused ? colors.warningMuted : colors.surfaceBorder,
          borderWidth: isPaused ? 1.5 : 1,
        },
        shadows.card,
      ]}
    >
      <View style={styles.pausedHeader}>
        <View style={[styles.statusDot, { backgroundColor: isPaused ? colors.warning : colors.textTertiary }]} />
        <Text style={[textStyles.labelMedium, { color: isPaused ? colors.warning : colors.textTertiary, marginLeft: spacing[1.5] }]}>
          {isPaused ? 'PAUSED' : 'RIDE ENDED'}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <StatCell value={formattedTime} label="Duration" />
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <StatCell value={String(Math.round(speedKmh))} unit="km/h" label="Avg Speed" />
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <StatCell value={formattedDist} label="Distance" />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[5],
    overflow: 'hidden',
  },
  // Idle
  idleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  idleIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleText: {
    flex: 1,
  },
  // Active
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  crashBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  // Paused
  pausedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statDivider: {
    width: 1,
    height: 36,
    marginHorizontal: spacing[2],
  },
});
