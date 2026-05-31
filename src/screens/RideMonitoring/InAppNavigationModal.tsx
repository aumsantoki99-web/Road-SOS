import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from '../../components/common/MapViewCompat';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { NavigationService } from '../../services/navigation.service';
import { HospitalService } from '../../services/hospital.service';
import { CustomButton } from '../../components/common/CustomButton';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { Hospital } from '../../types';
import type { InAppNavigationScreenProps } from '../../navigation/types';
import type { RouteDetails, RouteStep } from '../../services/navigation.service';


export function InAppNavigationModal({ route }: InAppNavigationScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const nav = useAppNavigation();
  const { hospitalId } = route.params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const { location: liveLoc } = useLiveLocation(true);

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLoc, setSimulatedLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  // Animated elements
  const panelSlide = useRef(new Animated.Value(100)).current;
  const topBarFade = useRef(new Animated.Value(0)).current;

  const lastRoutedLocRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Load hospital & route
  useEffect(() => {
    async function loadData() {
      try {
        const hosp = await HospitalService.getById(hospitalId);
        if (!hosp) {
          Alert.alert('Error', 'Hospital details not found.');
          nav.goBack();
          return;
        }
        setHospital(hosp);

        const currentPos = liveLoc
          ? { latitude: liveLoc.latitude, longitude: liveLoc.longitude }
          : { latitude: 22.3039, longitude: 70.8022 }; // Default Rajkot Center

        lastRoutedLocRef.current = currentPos;

        const details = await NavigationService.getRoute(
          currentPos,
          { latitude: hosp.latitude ?? 22.3039, longitude: hosp.longitude ?? 70.8022 },
          hosp.name
        );
        setRouteDetails(details);

        // Slide up panels
        Animated.parallel([
          Animated.spring(panelSlide, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 3 }),
          Animated.timing(topBarFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
      } catch (err) {
        console.error('[InAppNavigationModal] Error routing:', err);
      }
    }

    const lastRouted = lastRoutedLocRef.current;
    const isFallbackRouted = lastRouted && lastRouted.latitude === 22.3039 && lastRouted.longitude === 70.8022;

    if (!lastRouted || (isFallbackRouted && liveLoc)) {
      void loadData();
    }
  }, [hospitalId, liveLoc, nav, panelSlide, topBarFade]);

  // Adjust map viewport to show the entire route
  useEffect(() => {
    if (routeDetails && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeDetails.polyline, {
          edgePadding: { top: 120, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [routeDetails]);

  if (!hospital || !routeDetails) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.bgPrimary }]}>
        <Ionicons name="navigate" size={48} color={colors.accent} style={styles.spinIcon} />
        <Text style={[textStyles.bodyMedium, { color: colors.textSecondary, marginTop: spacing[4] }]}>
          Generating emergency route...
        </Text>
      </View>
    );
  }

  const activeRoute = routeDetails;
  const defaultPos = { latitude: 22.3039, longitude: 70.8022 };
  const currentPosition = simulatedLoc ?? (liveLoc ? { latitude: liveLoc.latitude, longitude: liveLoc.longitude } : (activeRoute.polyline[0] ?? defaultPos));

  const defaultStep: RouteStep = {
    instruction: 'Proceed to emergency entrance',
    distanceMeters: 0,
    durationSeconds: 0,
    iconName: 'flag',
  };
  const currentStep: RouteStep = activeRoute.steps[currentStepIndex] ?? activeRoute.steps[activeRoute.steps.length - 1] ?? defaultStep;

  // Simulation runner
  function handleStartSimulation() {
    if (!routeDetails) return;
    const currentRoute = routeDetails;

    if (isSimulating) {
      setIsSimulating(false);
      setSimulatedLoc(null);
      setCurrentStepIndex(0);
      return;
    }

    setIsSimulating(true);
    let index = 0;
    const polyline = currentRoute.polyline;

    const interval = setInterval(() => {
      if (index >= polyline.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulatedLoc(null);
        setCurrentStepIndex(0);
        Alert.alert('Arrived!', 'You have arrived at the hospital emergency entrance.');
        return;
      }

      const coord = polyline[index];
      if (!coord) return;
      setSimulatedLoc(coord);

      // Animate steps progression based on index ratio
      const ratio = index / polyline.length;
      const stepIdx = Math.min(
        Math.floor(ratio * currentRoute.steps.length),
        currentRoute.steps.length - 1
      );
      setCurrentStepIndex(stepIdx);

      // Focus map on moving simulator point
      mapRef.current?.animateCamera({
        center: coord,
        pitch: 45,
        zoom: 16.5,
      });

      index++;
    }, 1200);

    return () => clearInterval(interval);
  }

  function handleCall() {
    if (!hospital) return;
    const url = `tel:${hospital.phone}`;
    Linking.canOpenURL(url).then((ok) => {
      if (ok) void Linking.openURL(url);
      else Alert.alert('Error', 'Calling is not supported on this device.');
    });
  }

  function handleEndNavigation() {
    Alert.alert('End Navigation', 'Are you sure you want to stop this navigation session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => nav.goBack() },
    ]);
  }

  // Curated dark and light styles for premium design look
  const mapStyle = isDark
    ? [
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
      ]
    : [
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

  const remainingSteps = activeRoute.steps.slice(currentStepIndex + 1);
  const nextStep = remainingSteps[0];

  const iconMap: Record<string, string> = {
    'arrow-upward': 'arrow-up',
    'arrow-forward': 'arrow-forward',
    'arrow-back': 'arrow-back',
    'checkmark-circle': 'checkmark-circle',
    'flag': 'flag',
  };
  const iconName = iconMap[currentStep.iconName] ?? 'navigate';

  return (
    <View style={styles.container}>
      {/* ─── LIVE MAP CONTAINER ─────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        customMapStyle={mapStyle}
        showsUserLocation={!isSimulating}
        showsCompass={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {/* Render Polyline route path */}
        <Polyline
          coordinates={activeRoute.polyline}
          strokeColor={colors.emergency}
          strokeWidth={4.5}
        />
        {/* Glowing backdrop shadow line */}
        <Polyline
          coordinates={activeRoute.polyline}
          strokeColor={`${colors.emergency}35`}
          strokeWidth={10}
        />

        {/* Target Hospital marker */}
        <Marker
          coordinate={{ latitude: hospital.latitude ?? 23.0225, longitude: hospital.longitude ?? 72.5714 }}
          anchor={{ x: 0.5, y: 0.5 }}
        />

        {/* User moving/simulated cursor */}
        {isSimulating && (
          <Marker 
            coordinate={currentPosition} 
            flat 
            anchor={{ x: 0.5, y: 0.5 }} 
            image={require('../../assets/rider_marker.png')} 
          />
        )}
      </MapView>

      {/* ─── STICKY TOP TICKER PANEL ─────────────────────────────────── */}
      <Animated.View style={[styles.topPanel, { opacity: topBarFade, backgroundColor: colors.overlay, borderColor: colors.surfaceBorder }, shadows.card]}>
        <View style={styles.topRow}>
          <View style={styles.etaBox}>
            <Text style={[styles.etaValue, { color: colors.emergency }]}>
              {Math.max(1, Math.round(activeRoute.durationMinutes * (1 - currentStepIndex / activeRoute.steps.length)))}
            </Text>
            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>MIN</Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {(activeRoute.distanceKm * (1 - currentStepIndex / activeRoute.steps.length)).toFixed(1)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>KM REMAINING</Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {isSimulating ? '42' : liveLoc ? Math.round(liveLoc.speed ?? 0) : '0'}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>KM/H SPEED</Text>
          </View>
        </View>

        {/* Hospital label bar */}
        <View style={[styles.labelBar, { borderTopColor: colors.surfaceBorder }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.safe} />
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1], flex: 1 }]} numberOfLines={1}>
            Routing to {hospital.name} emergency wing
          </Text>
        </View>
      </Animated.View>

      {/* ─── BOTTOM NAVIGATION GUIDE PANEL ───────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomPanel,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.surfaceBorder,
            transform: [{ translateY: panelSlide }],
          },
          shadows.glowSafe,
        ]}
      >
        {/* Dynamic Turn Cue instruction */}
        <View style={[styles.turnCard, { backgroundColor: colors.safeSubtle, borderColor: colors.safeMuted }]}>
          <View style={[styles.turnIconWrap, { backgroundColor: colors.safe }]}>
            <Ionicons name={iconName as never} size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.headingMedium, { color: colors.textPrimary }]} numberOfLines={2}>
              {currentStep.instruction}
            </Text>
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: spacing[0.5] }]}>
              In {currentStep.distanceMeters} meters
            </Text>
          </View>
        </View>

        {/* Queue of upcoming steps */}
        {nextStep && (
          <View style={styles.upcomingBox}>
            <Ionicons name="trending-up-outline" size={12} color={colors.textTertiary} />
            <Text style={[textStyles.caption, { color: colors.textTertiary, marginLeft: spacing[1.5], flex: 1 }]} numberOfLines={1}>
              Next: {nextStep.instruction}
            </Text>
          </View>
        )}

        {/* Simulation Control */}
        <TouchableOpacity
          style={[styles.simButton, { backgroundColor: isSimulating ? `${colors.accent}20` : colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}
          onPress={handleStartSimulation}
        >
          <Ionicons name={isSimulating ? 'stop-circle-outline' : 'play-circle-outline'} size={16} color={colors.accent} />
          <Text style={[textStyles.labelMedium, { color: colors.accent, marginLeft: spacing[1.5] }]}>
            {isSimulating ? 'Stop Simulator' : 'Simulate Emergency Ride'}
          </Text>
        </TouchableOpacity>

        {/* Action Controls row */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <CustomButton
              label="End Navigation"
              onPress={handleEndNavigation}
              variant="danger"
              size="lg"
              fullWidth
              iconLeft="close-circle"
            />
          </View>
          <View style={{ width: spacing[3] }} />
          <View style={{ flex: 1 }}>
            <CustomButton
              label="Call ER Desk"
              onPress={handleCall}
              variant="primary"
              size="lg"
              fullWidth
              iconLeft="call"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinIcon: {
    transform: [{ rotate: '45deg' }],
  },

  // Map Markers
  markerHospWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Simulated location pulsing cursor
  simPulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  simPulseCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  simCursor: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simCursorIcon: {
    transform: [{ rotate: '-45deg' }],
    marginTop: -1.5,
    marginLeft: -0.5,
  },

  // Top Dashboard Ticker Overlay
  topPanel: {
    position: 'absolute',
    top: spacing[12],
    left: spacing[4],
    right: spacing[4],
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    paddingVertical: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[0.5],
  },
  etaValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing[4],
  },
  metricBox: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  labelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[2.5],
    marginHorizontal: spacing[4],
    borderTopWidth: borderWidth.thin,
  },

  // Bottom Floating panel
  bottomPanel: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: borderWidth.thin,
    borderBottomWidth: 0,
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
  },

  // Turn Cue instructions card
  turnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[3],
    gap: spacing[3],
  },
  turnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  upcomingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    marginHorizontal: spacing[1],
  },

  // Simulation button
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    paddingVertical: spacing[2.5],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  actionRow: {
    flexDirection: 'row',
  },
});
