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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from '../../components/common/MapViewCompat';

import { useTheme } from '../../context/ThemeContext';
import { useRideSession } from '../../hooks/useRideSession';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLiveLocation } from '../../hooks/useLiveLocation';

import { AppHeader } from '../../components/common/AppHeader';
import { CustomButton } from '../../components/common/CustomButton';
import { SpeedGauge } from './SpeedGauge';
import { RideSummaryCard } from './RideSummaryCard';
import { RideStartSequence } from './RideStartSequence';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDuration, formatDistance } from '../../utils';
import { HospitalService } from '../../services';
import type { RideSession, Hospital } from '../../types';
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

function CrashStatusModule({
  crashDetected,
  peakGForce,
  peakGyroRadS,
  isActive,
}: {
  crashDetected: boolean;
  peakGForce: number;
  peakGyroRadS: number;
  isActive: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  const checkScale = useRef(new Animated.Value(0)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
  }, [checkScale]);

  // Pulse when crash detected
  useEffect(() => {
    if (!crashDetected) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(alertPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [crashDetected, alertPulse]);

  const bgColor = crashDetected ? colors.emergencySubtle : isActive ? colors.safeSubtle : colors.surfaceSecondary;
  const borderColor = crashDetected ? colors.emergencyBorder : isActive ? colors.safeMuted : colors.surfaceBorder;
  const iconColor = crashDetected ? colors.emergency : colors.safe;
  const iconName = crashDetected ? 'warning' : 'shield-checkmark';
  const statusText = crashDetected
    ? 'Impact Detected — SOS triggered'
    : isActive
    ? 'Monitoring · No incidents'
    : 'Sensors ready';

  return (
    <View style={[styles.crashModule, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.crashModuleLeft}>
        <Animated.View
          style={[
            styles.crashCheckWrap,
            { backgroundColor: iconColor, transform: [{ scale: checkScale }] },
          ]}
        >
          <Animated.View style={{ opacity: crashDetected ? alertPulse : 1 }}>
            <Ionicons name={iconName} size={20} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]}>
            Crash Detection
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Live sensor readings */}
      {isActive && (
        <View style={styles.sensorReadings}>
          <View style={styles.sensorChip}>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>G</Text>
            <Text style={[textStyles.labelMedium, { color: peakGForce >= 3 ? colors.emergency : colors.textPrimary }]}>
              {peakGForce.toFixed(1)}
            </Text>
          </View>
          <View style={[styles.sensorChip, { marginTop: spacing[1] }]}>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>ω</Text>
            <Text style={[textStyles.labelMedium, { color: peakGyroRadS >= 3.5 ? colors.emergency : colors.textPrimary }]}>
              {peakGyroRadS.toFixed(1)}
            </Text>
          </View>
        </View>
      )}
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
  const [viewMode, setViewMode] = useState<'cockpit' | 'map'>('cockpit');
  const { location: liveLoc } = useLiveLocation(nav.status === 'active');
  const [breadcrumbs, setBreadcrumbs] = useState<{ latitude: number; longitude: number }[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    if (nav.status !== 'active') {
      setBreadcrumbs([]);
      return;
    }
    if (liveLoc) {
      setBreadcrumbs((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.latitude === liveLoc.latitude && last.longitude === liveLoc.longitude) {
          return prev;
        }
        return [...prev, { latitude: liveLoc.latitude, longitude: liveLoc.longitude }];
      });
    }
  }, [liveLoc, nav.status]);

  useEffect(() => {
    if (liveLoc && nearbyHospitals.length === 0) {
      HospitalService.getNearby({ latitude: liveLoc.latitude, longitude: liveLoc.longitude }, { maxResults: 5 })
        .then(setNearbyHospitals)
        .catch((err) => console.warn('[RideMonitoringScreen] Error loading hospitals:', err));
    }
  }, [liveLoc]);

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
            {/* View switcher segment control */}
            <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                onPress={() => setViewMode('cockpit')}
                style={[
                  styles.toggleButton,
                  viewMode === 'cockpit' && { backgroundColor: colors.surfacePrimary },
                ]}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={viewMode === 'cockpit' ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    textStyles.labelMedium,
                    { color: viewMode === 'cockpit' ? colors.textPrimary : colors.textSecondary, marginLeft: spacing[1.5] }
                  ]}
                >
                  Cockpit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('map')}
                style={[
                  styles.toggleButton,
                  viewMode === 'map' && { backgroundColor: colors.surfacePrimary },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={viewMode === 'map' ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    textStyles.labelMedium,
                    { color: viewMode === 'map' ? colors.textPrimary : colors.textSecondary, marginLeft: spacing[1.5] }
                  ]}
                >
                  Safety Map
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gauge or Live Map Section */}
            {viewMode === 'cockpit' ? (
              <View style={styles.gaugeSection}>
                <SpeedGauge
                  speedKmh={nav.speedKmh}
                  maxSpeedKmh={120}
                  isActive={isActive}
                />
              </View>
            ) : (
              <View style={[styles.mapSection, { borderColor: colors.surfaceBorder }, shadows.sm]}>
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={styles.rideMap}
                  customMapStyle={isDark ? mapStyleDark : mapStyleLight}
                  showsCompass={false}
                  showsMyLocationButton={false}
                  initialRegion={{
                    latitude: liveLoc?.latitude ?? 23.0225,
                    longitude: liveLoc?.longitude ?? 72.5714,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  }}
                  region={liveLoc ? {
                    latitude: liveLoc.latitude,
                    longitude: liveLoc.longitude,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  } : undefined}
                >
                  {/* Breadcrumb journey path */}
                  {breadcrumbs.length > 1 && (
                    <Polyline
                      coordinates={breadcrumbs}
                      strokeColor={colors.accent}
                      strokeWidth={4.5}
                    />
                  )}
                  {breadcrumbs.length > 1 && (
                    <Polyline
                      coordinates={breadcrumbs}
                      strokeColor={`${colors.accent}33`}
                      strokeWidth={10}
                    />
                  )}

                  {/* Dynamic user location direction marker */}
                  {liveLoc && (
                    <Marker
                      coordinate={{ latitude: liveLoc.latitude, longitude: liveLoc.longitude }}
                      flat
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={styles.markerAnchorWrap}>
                        <View style={[styles.userPulseCircle, { borderColor: colors.accent }]} />
                        <View
                          style={[
                            styles.userDirectionArrow,
                            {
                              backgroundColor: colors.accent,
                              transform: [{ rotate: `${liveLoc.heading ?? 0}deg` }],
                            },
                          ]}
                        >
                          <Ionicons name="navigate" size={12} color="#000" style={styles.directionArrowIcon} />
                        </View>
                      </View>
                    </Marker>
                  )}

                  {/* Nearby hospital safety anchors */}
                  {nearbyHospitals.map((hosp) => (
                    <Marker
                      key={hosp.id}
                      coordinate={{ latitude: hosp.latitude ?? 23.0225, longitude: hosp.longitude ?? 72.5714 }}
                      title={hosp.name}
                      description="Emergency Safety Anchor"
                      onCalloutPress={() => navigation.navigate('HospitalDetail', { hospitalId: hosp.id })}
                    >
                      <View
                        style={[
                          styles.hospMarkerPin,
                          {
                            backgroundColor: hosp.isEmergencyCenter ? colors.emergency : colors.accent,
                            borderColor: '#FFFFFF',
                          },
                          shadows.glowEmergency,
                        ]}
                      >
                        <Ionicons name="medical" size={12} color="#FFFFFF" />
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>
            )}

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

            {/* Crash status module — live sensor data */}
            <CrashStatusModule
              crashDetected={nav.crashDetected}
              peakGForce={nav.peakGForce}
              peakGyroRadS={nav.peakGyroRadS}
              isActive={isActive}
            />

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

// ─── Map Styles ──────────────────────────────────────────────────────────────

const mapStyleDark = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0d1b2a' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#748cab' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d1b2a' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1b263b' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#132135' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8d99ae' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1b263b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#415a77' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1f3a60' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0b132b' }],
  },
];

const mapStyleLight = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }],
  },
];

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
  sensorReadings: {
    alignItems: 'flex-end',
    gap: spacing[1],
    flexShrink: 0,
  },
  sensorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
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

  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[1],
    marginBottom: spacing[4],
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
  },
  mapSection: {
    height: 320,
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
    marginBottom: spacing[5],
  },
  rideMap: {
    ...StyleSheet.absoluteFillObject,
  },
  markerAnchorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  userDirectionArrow: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionArrowIcon: {
    transform: [{ rotate: '-45deg' }],
    marginTop: -1.5,
    marginLeft: -0.5,
  },
  hospMarkerPin: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
