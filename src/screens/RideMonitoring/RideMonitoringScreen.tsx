/**
 * RideMonitoringScreen — Immersive Ride Experience
 * feature/ui-polish-ride ✅
 *
 * Redesigned as an immersive safety cockpit.
 * Feels like: a real-time safety dashboard from a premium vehicle app.
 *
 * Enhancements:
 *   - Full-bleed dark header with active ride gradient
 *   - Live-feel animated metrics row
 *   - Glowing "LIVE" indicator when ride is active
 *   - Crash detection card styled as a proper status module
 *   - Controls redesigned — primary action full-width, secondary inline
 *   - Ride summary slides up with spring animation
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useRideSession } from '../../hooks/useRideSession';
import { useAppNavigation } from '../../navigation/useAppNavigation';

import { AppHeader } from '../../components/common/AppHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { SpeedGauge } from './SpeedGauge';
import { RideSummaryCard } from './RideSummaryCard';
import { RideStartSequence } from './RideStartSequence';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDuration, formatDistance } from '../../utils';
import type { RideSession } from '../../types';
import type { RideScreenProps } from '../../navigation/types';

// ─── Live indicator ───────────────────────────────────────────────────────────

function LiveIndicator({ isActive }: { isActive: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) { opacity.setValue(1); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, opacity]);

  if (!isActive) return <></>;

  return (
    <View style={styles.liveIndicator}>
      <Animated.View style={[styles.liveDot, { backgroundColor: colors.emergency, opacity }]} />
      <Text style={[styles.liveText, { color: colors.emergency }]}>LIVE</Text>
    </View>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  value,
  unit,
  label,
  icon,
  glowing,
}: {
  value: string;
  unit?: string;
  label: string;
  icon: string;
  glowing?: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: glowing ? colors.safeMuted : colors.surfaceBorder,
        },
        glowing && shadows.glowSafe,
      ]}
    >
      <Ionicons name={icon as 'time'} size={14} color={glowing ? colors.safe : colors.iconSecondary} />
      <Text style={[textStyles.numericLarge, { color: colors.textPrimary, marginTop: spacing[2] }]}>
        {value}
        {unit !== undefined && (
          <Text style={[textStyles.caption, { color: colors.textTertiary }]}> {unit}</Text>
        )}
      </Text>
      <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[1] }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Crash status module ──────────────────────────────────────────────────────

function CrashStatusModule(): React.JSX.Element {
  const { colors } = useTheme();
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
  }, [checkScale]);

  return (
    <View style={[styles.crashModule, { backgroundColor: colors.safeSubtle, borderColor: colors.safeMuted }]}>
      <View style={styles.crashModuleLeft}>
        <Animated.View
          style={[
            styles.crashCheckWrap,
            { backgroundColor: colors.safe, transform: [{ scale: checkScale }] },
          ]}
        >
          <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]}>
            Crash Detection
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            No incidents detected · mock placeholder
          </Text>
        </View>
      </View>
      <View style={[styles.mockTag, { backgroundColor: colors.infoSubtle, borderColor: colors.infoMuted }]}>
        <Text style={[textStyles.caption, { color: colors.info, fontWeight: '700' }]}>MOCK</Text>
      </View>
    </View>
  );
}

// ─── Idle state hero ─────────────────────────────────────────────────────────

function IdleHero({ onStart }: { onStart: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.idleHero,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Central shield */}
      <View style={[styles.idleShieldWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <LinearGradient
          colors={[colors.surfaceSecondary, colors.surfacePrimary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="shield-outline" size={56} color={colors.textTertiary} />
      </View>

      <Text style={[textStyles.displaySmall, { color: colors.textPrimary, marginTop: spacing[5] }]}>
        Ready to ride
      </Text>
      <Text style={[textStyles.bodyMedium, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center', maxWidth: 240 }]}>
        Start a ride to activate safety monitoring and crash detection
      </Text>

      <View style={{ marginTop: spacing[8], width: '100%' }}>
        <CustomButton
          label="Start Ride"
          onPress={onStart}
          variant="primary"
          size="lg"
          fullWidth
          iconLeft="speedometer"
        />
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RideMonitoringScreen(_props: RideScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const nav = useRideSession();
  const navigation = useAppNavigation();
  const [completedSession, setCompletedSession] = useState<RideSession | null>(null);
  const [showStartSequence, setShowStartSequence] = useState(false);

  const isIdle   = nav.status === 'idle';
  const isActive = nav.status === 'active';
  const isPaused = nav.status === 'paused';

  // Header gradient shifts with ride state
  const headerGradient: [string, string] = isActive
    ? [colors.safeSubtle, colors.bgPrimary]
    : isPaused
    ? [colors.warningSubtle, colors.bgPrimary]
    : [colors.bgElevated, colors.bgPrimary];

  function handleStart(): void {
    setCompletedSession(null);
    setShowStartSequence(true);
  }

  function handleSequenceComplete(): void {
    setShowStartSequence(false);
    nav.startRide();
  }

  function handleStop(): void {
    Alert.alert('End Ride', 'Are you sure you want to end this ride?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Ride',
        style: 'destructive',
        onPress: () => {
          const session = nav.stopRide();
          if (session) setCompletedSession(session);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Gradient header band */}
      <LinearGradient
        colors={headerGradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      <RideStartSequence
        visible={showStartSequence}
        onComplete={handleSequenceComplete}
      />

      <AppHeader
        title="Ride Monitor"
        rightAction={{
          icon: 'time-outline',
          onPress: () => navigation.navigate('RideHistory'),
          accessibilityLabel: 'View ride history',
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status strip ─────────────────────────────────────────────── */}
        {!isIdle && (
          <View style={[
            styles.statusStrip,
            { backgroundColor: isActive ? colors.safeSubtle : colors.warningSubtle,
              borderColor: isActive ? colors.safeMuted : colors.warningMuted },
          ]}>
            <View style={styles.statusStripLeft}>
              <LiveIndicator isActive={isActive} />
              {!isActive && (
                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.liveText, { color: colors.warning }]}>PAUSED</Text>
                </View>
              )}
              <Text style={[textStyles.bodySmall, { color: isActive ? colors.safeText : colors.warningText, marginLeft: spacing[2] }]}>
                {isActive ? 'Safety monitoring active' : 'Monitoring paused'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Idle hero ────────────────────────────────────────────────── */}
        {isIdle && completedSession === null && (
          <IdleHero onStart={handleStart} />
        )}

        {/* ── Active / paused ride UI ──────────────────────────────────── */}
        {!isIdle && (
          <>
            {/* Speed gauge */}
            <View style={styles.gaugeSection}>
              <SpeedGauge
                speedKmh={nav.speedKmh}
                maxSpeedKmh={120}
                isActive={isActive}
              />
            </View>

            {/* Metrics row */}
            <View style={styles.metricsRow}>
              <MetricCard
                value={formatDuration(nav.elapsedSeconds)}
                label="DURATION"
                icon="time-outline"
                glowing={isActive}
              />
              <View style={{ width: spacing[3] }} />
              <MetricCard
                value={formatDistance(nav.distanceKm)}
                label="DISTANCE"
                icon="navigate-outline"
                glowing={isActive}
              />
              <View style={{ width: spacing[3] }} />
              <MetricCard
                value={String(Math.round(nav.speedKmh))}
                unit="km/h"
                label="SPEED"
                icon="speedometer-outline"
              />
            </View>

            {/* Crash status module */}
            <CrashStatusModule />

            {/* Ride controls */}
            {completedSession === null && (
              <View style={styles.controls}>
                {isActive && (
                  <>
                    <CustomButton
                      label="End Ride"
                      onPress={handleStop}
                      variant="danger"
                      size="lg"
                      fullWidth
                      iconLeft="stop-circle"
                    />
                    <View style={{ height: spacing[3] }} />
                    <CustomButton
                      label="Pause Ride"
                      onPress={nav.pauseRide}
                      variant="secondary"
                      size="md"
                      fullWidth
                      iconLeft="pause"
                    />
                  </>
                )}
                {isPaused && (
                  <>
                    <CustomButton
                      label="Resume Ride"
                      onPress={nav.resumeRide}
                      variant="primary"
                      size="lg"
                      fullWidth
                      iconLeft="play"
                    />
                    <View style={{ height: spacing[3] }} />
                    <CustomButton
                      label="End Ride"
                      onPress={handleStop}
                      variant="danger"
                      size="md"
                      fullWidth
                      iconLeft="stop-circle"
                    />
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Ride summary ─────────────────────────────────────────────── */}
        {completedSession !== null && (
          <View style={styles.summarySection}>
            <RideSummaryCard
              session={completedSession}
              onDismiss={() => setCompletedSession(null)}
              onNewRide={handleStart}
            />
          </View>
        )}

        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[2],
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    marginBottom: spacing[4],
  },
  statusStripLeft: { flexDirection: 'row', alignItems: 'center' },

  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  liveDot:  { width: 7, height: 7, borderRadius: radius.full },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  gaugeSection: { alignItems: 'center', paddingVertical: spacing[4] },

  metricsRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
  },

  crashModule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  crashModuleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  crashCheckWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mockTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },

  controls:       { gap: spacing[0] },
  summarySection: { marginBottom: spacing[4] },

  idleHero: {
    alignItems: 'center',
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
  },
  idleShieldWrap: {
    width: 120,
    height: 120,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
