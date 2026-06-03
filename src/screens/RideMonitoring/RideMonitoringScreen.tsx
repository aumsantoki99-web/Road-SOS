/* eslint-disable react-native/no-unused-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from '../../components/common/MapViewCompat';

import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../theme/typography';
import { useTranslation } from '../../context/LocalizationContext';
import { useRideSession } from '../../hooks/useRideSession';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { darkMapStyle, lightMapStyle } from '../../constants/mapStyle';
import { formatDuration } from '../../utils';
import { StorageService } from '../../storage/StorageService';
import { STORAGE_KEYS } from '../../constants';
import type { RideSession } from '../../types';
import { CustomButton } from '../../components/common/CustomButton';
import { WeatherService, WeatherInfo } from '../../services/weatherService';
import { convoyService, ConvoyMember } from '../../services/convoyService';

export function RideMonitoringScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const nav = useRideSession();
  const navigation = useAppNavigation();
  const mapRef = useRef<MapView | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ latitude: number; longitude: number }[]>([]);
  const [viewMode, setViewMode] = useState<'cockpit' | 'map'>('cockpit');
  const shouldTrackLocation = nav.status === 'active' || viewMode === 'map';
  const { location: liveLoc } = useLiveLocation(shouldTrackLocation);
  const insets = useSafeAreaInsets();

  const isActive = nav.status === 'active';
  const crashDetected = nav.crashDetected;

  useEffect(() => {
    if (!shouldTrackLocation) return;
    if (liveLoc) {
      setBreadcrumbs(prev => {
        const last = prev[prev.length - 1];
        if (last && last.latitude === liveLoc.latitude && last.longitude === liveLoc.longitude) {
          return prev;
        }
        return [...prev, { latitude: liveLoc.latitude, longitude: liveLoc.longitude }];
      });
    }
  }, [liveLoc, shouldTrackLocation]);

  useEffect(() => {
    if (viewMode !== 'map' || !liveLoc || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: liveLoc.latitude,
        longitude: liveLoc.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      500,
    );
  }, [liveLoc, viewMode]);

  // For the bottom sheet animation
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Handle back button
  const handleBack = () => {
    if (isActive) {
      nav.pauseRide();
    }
    navigation.goBack();
  };

  const userId = React.useRef('rider-' + Math.floor(Math.random() * 10000)).current;
  const [lastRide, setLastRide] = useState<RideSession | null>(null);
  const [showLastRideModal, setShowLastRideModal] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [convoyMembers, setConvoyMembers] = useState<ConvoyMember[]>([]);

  useEffect(() => {
    convoyService.onMembersUpdate((members) => {
      setConvoyMembers(members.filter(m => m.id !== userId));
    });
  }, [userId]);

  useEffect(() => {
    if (liveLoc) {
      convoyService.updateLocation(userId, liveLoc.latitude, liveLoc.longitude, liveLoc.speed || 0);
    }
  }, [liveLoc, userId]);

  useEffect(() => {
    if (!liveLoc || weather) return;
    WeatherService.getLiveWeather(liveLoc.latitude, liveLoc.longitude).then(res => {
      if (res) setWeather(res);
    });
  }, [liveLoc, weather]);

  const handleShowLastRide = async () => {
    const res = await StorageService.get<RideSession>(STORAGE_KEYS.LAST_RIDE);
    if (res.success && res.data) {
      setLastRide(res.data);
      setShowLastRideModal(true);
    } else {
      Alert.alert('No Ride History', 'You have not completed any rides yet.');
    }
  };

  // Mock progress steps based on ride duration
  const getProgressStep = () => {
    if (!isActive) return 0;
    const elapsed = nav.elapsedSeconds;
    if (elapsed < 10) return 0; // Ride Started
    if (elapsed < 60) return 1; // Monitoring Active
    if (elapsed < 300) return 2; // On the Way
    return 3; // Nearing Destination
  };

  const currentStep = getProgressStep();

  const renderStep = (title: string, index: number, icon: string) => {
    const isCompleted = currentStep >= index;
    const isCurrent = currentStep === index;
    
    return (
      <View key={index} style={styles.stepContainer}>
        <View style={[
          styles.stepIconWrap, 
          isCompleted ? { backgroundColor: colors.safe } : { backgroundColor: colors.surfaceBorder },
          isCurrent && { transform: [{ scale: 1.1 }] }
        ]}>
          <Ionicons name={icon as any} size={16} color={isCompleted ? '#FFF' : colors.textTertiary} />
        </View>
        <Text style={[
          styles.stepText, 
          isCompleted ? { color: colors.textPrimary } : { color: colors.textTertiary }
        ]}>
          {title}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── MAP VIEW MODE ── */}
      {viewMode === 'map' && (
        <MapView
          ref={mapRef}
          key={isDark ? 'ride-map-dark' : 'ride-map-light'}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
          showsUserLocation={true}
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
          {/* Dynamic Route Line */}
          {breadcrumbs.length > 1 && (
            <>
              <Polyline
                coordinates={breadcrumbs}
                strokeColor="rgba(57, 255, 20, 0.28)"
                strokeWidth={12}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={breadcrumbs}
                strokeColor="#39FF14"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}

          {/* Convoy Members */}
          {convoyMembers.map(member => (
            <Marker
              key={member.id}
              coordinate={{ latitude: member.latitude, longitude: member.longitude }}
              title={member.name}
              description={`${Math.round(member.speed)} km/h`}
              pinColor="violet"
            />
          ))}
        </MapView>
      )}

      {/* ── TOP FLOATING HEADER (VISIBLE IN BOTH MODES) ── */}
      <View style={[styles.topSafeArea, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.segmentControl}>
            <TouchableOpacity 
              onPress={() => setViewMode('cockpit')} 
              style={[styles.segmentBtn, viewMode === 'cockpit' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, viewMode === 'cockpit' && styles.segmentTextActive]}>
                Cockpit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode('map')} 
              style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, viewMode === 'map' && styles.segmentTextActive]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.iconButton} onPress={handleShowLastRide}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Convoy Fall-behind Warning */}
        {convoyMembers.map(m => {
           const dLat = (m.latitude - (liveLoc?.latitude || 0)) * 111;
           const dLon = (m.longitude - (liveLoc?.longitude || 0)) * 111;
           const dist = Math.sqrt(dLat*dLat + dLon*dLon);
           if (dist > 2) {
             return (
               <View key={m.id} style={{ 
                 backgroundColor: colors.surfacePrimary, 
                 borderColor: colors.emergency,
                 borderWidth: 2,
                 padding: 16, 
                 marginHorizontal: 20, 
                 borderRadius: 16, 
                 marginTop: 12,
                 flexDirection: 'row',
                 alignItems: 'center',
                 elevation: 8,
                 shadowColor: colors.emergency,
                 shadowOffset: { width: 0, height: 4 },
                 shadowOpacity: 0.3,
                 shadowRadius: 8
               }}>
                 <View style={{ backgroundColor: `${colors.emergency}20`, padding: 10, borderRadius: 12, marginRight: 12 }}>
                   <Ionicons name="warning" size={24} color={colors.emergency} />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={[textStyles.headingSmall, { color: colors.emergency, marginBottom: 2 }]}>
                     Rider Left Behind
                   </Text>
                   <Text style={[textStyles.bodySmall, { color: colors.textSecondary }]}>
                     <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{m.name}</Text> has dropped {dist.toFixed(1)} km behind!
                   </Text>
                 </View>
               </View>
             );
           }
           return null;
        })}

        {viewMode === 'map' && (
          <View style={styles.etaPill}>
            <View style={styles.etaLeft}>
              <Ionicons name="bicycle" size={18} color={colors.safe} />
              <Text style={styles.etaText}>
                Duration: {formatDuration(nav.elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.etaDivider} />
            <Text style={styles.etaSubText}>On the way</Text>
            <TouchableOpacity style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── COCKPIT VIEW MODE ── */}
      {viewMode === 'cockpit' && (
        <View style={styles.cockpitContainer}>
          
          {weather && (
            <View style={[styles.weatherBanner, weather.isHazard && styles.weatherBannerHazard]}>
              <View style={styles.weatherIconRow}>
                <Ionicons name={weather.isHazard ? 'warning' : weather.iconName} size={24} color={weather.isHazard ? '#FFF' : colors.textPrimary} />
                <Text style={[styles.weatherTempText, weather.isHazard && { color: '#FFF' }]}>
                  {weather.temperature}°C  •  {weather.windSpeed} km/h
                </Text>
              </View>
              <Text style={[styles.weatherDescText, weather.isHazard && { color: '#FFF', fontWeight: 'bold' }]}>
                {weather.isHazard ? weather.hazardMessage : weather.description}
              </Text>
            </View>
          )}

          <View style={styles.statusBanner}>
            <Ionicons 
              name={isActive ? 'shield-checkmark' : 'bicycle'} 
              size={32} 
              color={isActive ? colors.safe : colors.textSecondary} 
            />
            <Text style={[styles.statusText, { color: isActive ? colors.safe : colors.textSecondary }]}>
              {isActive ? t('home.rideActive') : t('home.readyToRide')}
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>SPEED</Text>
                <View style={styles.metricValueWrap}>
                  <Text style={styles.metricValue}>{isActive ? Math.round(nav.speedKmh) : '--'}</Text>
                  <Text style={styles.metricUnit}>KM/H</Text>
                </View>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>DISTANCE</Text>
                <View style={styles.metricValueWrap}>
                  <Text style={styles.metricValue}>{nav.distanceKm.toFixed(1)}</Text>
                  <Text style={styles.metricUnit}>KM</Text>
                </View>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>DURATION</Text>
                <View style={styles.metricDurationWrap}>
                  <Text style={styles.metricDurationValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {formatDuration(nav.elapsedSeconds)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            {nav.canStart && (
              <TouchableOpacity onPress={nav.startRide} style={[styles.actionBtn, { backgroundColor: colors.safe }]}>
                <Ionicons name="play" size={20} color={colors.surfacePrimary} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>{t('home.startRide')}</Text>
              </TouchableOpacity>
            )}
            {nav.canPause && (
              <TouchableOpacity onPress={nav.pauseRide} style={[styles.actionBtn, { backgroundColor: colors.warning }]}>
                <Ionicons name="pause" size={20} color={colors.surfacePrimary} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Pause</Text>
              </TouchableOpacity>
            )}
            {nav.canResume && (
              <TouchableOpacity onPress={nav.resumeRide} style={[styles.actionBtn, { backgroundColor: colors.safe }]}>
                <Ionicons name="play" size={20} color={colors.surfacePrimary} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Resume</Text>
              </TouchableOpacity>
            )}
            {nav.canStop && (
              <TouchableOpacity onPress={() => nav.stopRide()} style={[styles.actionBtn, { backgroundColor: colors.emergency }]}>
                <Ionicons name="stop" size={20} color={colors.surfacePrimary} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>{t('home.stopRide')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── BOTTOM TRACKING SHEET (ONLY ON MAP MODE OR CRASH) ── */}
      {(viewMode === 'map' || crashDetected) && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          {crashDetected ? (
            <View style={styles.addressBarCrash}>
              <Ionicons name="warning" size={24} color={colors.emergency} />
              <Text style={styles.crashText}>CRASH DETECTED — SOS INITIATED</Text>
            </View>
          ) : (
            <View style={styles.addressBar}>
              <Ionicons name="speedometer-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.addressText} numberOfLines={1}>
                {nav.distanceKm.toFixed(1)} km  •  {nav.speedKmh.toFixed(0)} km/h  •  {formatDuration(nav.elapsedSeconds)}
              </Text>
              <View style={styles.distancePill}>
                <Text style={styles.distanceText}>{t('home.active')}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── LAST RIDE MODAL ── */}
      <Modal visible={showLastRideModal} transparent animationType="fade" onRequestClose={() => setShowLastRideModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="time-outline" size={28} color={colors.safe} />
              <Text style={styles.modalTitle}>{t('home.recentRides')}</Text>
            </View>
            {lastRide && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Distance Covered</Text>
                  <Text style={styles.modalValue}>{(lastRide.distanceKm || 0).toFixed(1)} km</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Total Duration</Text>
                  <Text style={styles.modalValue}>
                    {formatDuration(lastRide.endTime ? Math.round((lastRide.endTime - lastRide.startTime) / 1000) : 0)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Average Speed</Text>
                  <Text style={styles.modalValue}>{(lastRide.avgSpeedKmh || 0).toFixed(1)} km/h</Text>
                </View>
              </View>
            )}
            <CustomButton label={t('settings.done')} onPress={() => setShowLastRideModal(false)} variant="secondary" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfacePrimary,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 4,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfacePrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    ...textStyles.labelMedium,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfacePrimary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  etaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    color: colors.safe,
    fontWeight: '700',
    fontSize: 15,
  },
  etaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 12,
  },
  etaSubText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    marginRight: 12,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cockpitContainer: {
    flex: 1,
    paddingTop: 180,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  weatherBanner: {
    width: '100%',
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  weatherBannerHazard: {
    backgroundColor: colors.emergency,
  },
  weatherIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weatherTempText: {
    ...textStyles.labelLarge,
    color: colors.textPrimary,
  },
  weatherDescText: {
    ...textStyles.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusBanner: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  statusText: {
    ...textStyles.headingLarge,
    letterSpacing: 0.5,
  },
  metricsGrid: {
    width: '100%',
    gap: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  metricLabel: {
    ...textStyles.labelCaps,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  metricDurationWrap: {
    width: '100%',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    ...textStyles.numericLarge,
    color: colors.textPrimary,
  },
  metricDurationValue: {
    ...textStyles.headingLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 16,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    ...textStyles.labelLarge,
    color: '#FFF',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
  },
  progressLineBg: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.surfaceBorder,
    zIndex: 1,
  },
  progressLineActive: {
    position: 'absolute',
    top: 18,
    left: 20,
    height: 2,
    backgroundColor: colors.safe,
    zIndex: 2,
  },
  stepContainer: {
    alignItems: 'center',
    zIndex: 3,
    width: 60,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: colors.surfaceBorder,
    borderWidth: 3,
    borderColor: colors.surfacePrimary,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addressBarCrash: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emergencySubtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    gap: 8,
  },
  crashText: {
    color: colors.emergency,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surfacePrimary,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    ...textStyles.displaySmall,
    color: colors.textPrimary,
  },
  modalBody: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    ...textStyles.labelLarge,
    color: colors.textSecondary,
  },
  modalValue: {
    ...textStyles.headingMedium,
    color: colors.textPrimary,
  },
  addressText: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  distancePill: {
    backgroundColor: colors.safeSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: colors.safe,
    fontWeight: '700',
    fontSize: 12,
  },
});
