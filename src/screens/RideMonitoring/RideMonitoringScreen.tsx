/* eslint-disable react-native/no-unused-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Image,
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
import { pastelMapStyle } from '../../constants/mapStyle';
import { formatDuration } from '../../utils';
import { StorageService } from '../../storage/StorageService';
import { STORAGE_KEYS } from '../../constants';
import type { RideSession } from '../../types';
import { CustomButton } from '../../components/common/CustomButton';

export function RideMonitoringScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const nav = useRideSession();
  const navigation = useAppNavigation();
  const { location: liveLoc } = useLiveLocation(nav.status === 'active');
  const [breadcrumbs, setBreadcrumbs] = useState<{ latitude: number; longitude: number }[]>([]);
  const [viewMode, setViewMode] = useState<'cockpit' | 'map'>('cockpit');
  const insets = useSafeAreaInsets();

  const isActive = nav.status === 'active';
  const crashDetected = nav.crashDetected;

  useEffect(() => {
    if (!isActive) return;
    if (liveLoc) {
      setBreadcrumbs(prev => {
        const last = prev[prev.length - 1];
        if (last && last.latitude === liveLoc.latitude && last.longitude === liveLoc.longitude) {
          return prev;
        }
        return [...prev, { latitude: liveLoc.latitude, longitude: liveLoc.longitude }];
      });
    }
  }, [liveLoc, isActive]);

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

  const [lastRide, setLastRide] = useState<RideSession | null>(null);
  const [showLastRideModal, setShowLastRideModal] = useState(false);

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
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          customMapStyle={pastelMapStyle}
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
            <Polyline
              coordinates={breadcrumbs}
              strokeColor="#39FF14" // Electric Lime Green!
              strokeWidth={6}
            />
          )}

          {/* Minimal User Location Marker */}
          {liveLoc && (
            <Marker
              coordinate={{ latitude: liveLoc.latitude, longitude: liveLoc.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={999}
            >
              <View style={styles.userMarkerWrap}>
                <View style={[styles.userMarkerGlow, { backgroundColor: 'rgba(57, 255, 20, 0.4)' }]} />
                <View style={[styles.userMarkerCore, { backgroundColor: '#39FF14' }]} />
              </View>
            </Marker>
          )}
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
                <View style={styles.metricValueWrap}>
                  <Text style={styles.metricValue}>{formatDuration(nav.elapsedSeconds)}</Text>
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
    paddingTop: 220,
    alignItems: 'center',
    paddingHorizontal: 20,
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
  metricValue: {
    ...textStyles.numericLarge,
    color: colors.textPrimary,
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
  userMarkerWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surfacePrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
