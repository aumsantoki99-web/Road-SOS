/**
 * NearbyHospitalsScreen — Actionable Emergency UI
 * feature/ui-polish-hospitals ✅
 *
 * Enhancements:
 *   - Premium live map using react-native-maps
 *   - Centers on user's live position
 *   - Color-coded marker pins for hospitals (red = emergency, orange = regular)
 *   - Bounded 5km radius safety circle overlay
 *   - Connects seamlessly to hospital detail navigation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from '../../components/common/MapViewCompat';

import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LocalizationContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDistance } from '../../utils';
import { HospitalService } from '../../services';
import type { Hospital } from '../../types';
import type { HospitalsScreenProps } from '../../navigation/types';


// ─── Live interactive Map component ──────────────────────────────────────────

function LiveMap({
  userLocation,
  hospitals,
  selectedHospitalId,
  onHospitalSelect,
  isFullscreen,
  onToggleFullscreen,
}: {
  userLocation: { latitude: number; longitude: number } | null;
  hospitals: Hospital[];
  selectedHospitalId?: string | null;
  onHospitalSelect?: (hospital: Hospital) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}): React.JSX.Element {
  const { colors, isDark } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const coords = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        ...hospitals
          .filter((h) => h.latitude && h.longitude)
          .map((h) => ({ latitude: h.latitude as number, longitude: h.longitude as number })),
      ];
      if (coords.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [userLocation, hospitals]);

  const mapStyle = isDark
    ? [
        { elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#748cab' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1b2a' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1b263b' }] },
        { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#132135' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8d99ae' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b263b' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#415a77' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1f3a60' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b132b' }] },
      ]
    : [
        { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f2fe' }] },
      ];

  const defaultCenter = userLocation || { latitude: 23.0225, longitude: 72.5714 };

  return (
    <View style={[styles.mapWrap, isFullscreen && styles.mapWrapFullscreen, { backgroundColor: isDark ? '#0D1B2A' : '#E8F4FD' }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        mapType="standard"
        showsUserLocation={true}
        showsCompass={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: defaultCenter.latitude,
          longitude: defaultCenter.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {userLocation && (
          <>
            <Circle
              center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              radius={5000} // 5km search radius
              fillColor={isDark ? 'rgba(74, 140, 171, 0.08)' : 'rgba(14, 116, 144, 0.05)'}
              strokeColor={colors.accent}
              strokeWidth={1.5}
            />
            <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} anchor={{ x: 0.5, y: 0.5 }} zIndex={999}>
              <View style={styles.userMarkerWrap}>
                <View style={[styles.userMarkerGlow, { backgroundColor: colors.accent + '40' }]} />
                <View style={[styles.userMarkerCore, { backgroundColor: colors.accent }]} />
              </View>
            </Marker>
          </>
        )}

        {hospitals.map((h) => {
          if (!h.latitude || !h.longitude) return null;
          const sType = h.serviceType || 'hospital';
          const isEmergency = h.isEmergencyCenter;
          
          let pinColor = isEmergency ? colors.emergency : '#F59E0B';
          let iconName = "medical";
          let desc = h.isEmergencyCenter ? '24/7 Emergency Wing' : 'Clinic / Hospital';
          
          if (sType === 'police') {
            pinColor = '#3B82F6';
            iconName = 'shield';
            desc = 'Police Station';
          } else if (sType === 'towing') {
            pinColor = '#D97706';
            iconName = 'car';
            desc = 'Towing / Car Repair';
          }
          
          const isSelected = selectedHospitalId === h.id;

          return (
            <Marker
              key={h.id}
              coordinate={{ latitude: h.latitude, longitude: h.longitude }}
              title={h.name}
              description={desc}
              onPress={() => onHospitalSelect && onHospitalSelect(h)}
              onCalloutPress={() => onHospitalSelect && onHospitalSelect(h)}
            >
              <View
                style={[
                  styles.markerHospWrap,
                  {
                    backgroundColor: pinColor,
                    borderColor: '#FFFFFF',
                    transform: [{ scale: isSelected ? 1.25 : 1 }],
                  },
                  isEmergency && sType === 'hospital' ? shadows.glowEmergency : shadows.sm,
                ]}
              >
                <Ionicons name={iconName as any} size={14} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Gradient fade bottom */}
      <LinearGradient
        colors={['transparent', isDark ? '#0D1B2A' : '#E8F4FD']}
        style={styles.mapFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      {/* Dynamic Status / SDK label */}
      <View style={[styles.mapLabel, { backgroundColor: colors.overlay }]}>
        <Ionicons name="navigate-circle-outline" size={12} color={colors.textSecondary} />
        <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
          Live Tracking Map · 5km Search Radius Active
        </Text>
      </View>

      {/* Legend Box */}
      <View style={[styles.legendBox, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendColor, { backgroundColor: colors.emergency }]} />
          <Text style={[textStyles.caption, { color: colors.textPrimary }]}>24H Emergency</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
          <Text style={[textStyles.caption, { color: colors.textPrimary }]}>Clinic / Hospital</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
          <Text style={[textStyles.caption, { color: colors.textPrimary }]}>Police Station</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendColor, { backgroundColor: '#D97706' }]} />
          <Text style={[textStyles.caption, { color: colors.textPrimary }]}>Towing</Text>
        </View>
      </View>

      {/* Expand/Close Button */}
      {onToggleFullscreen && (
        <TouchableOpacity
          style={[styles.expandBtn, { backgroundColor: colors.surfacePrimary }]}
          onPress={onToggleFullscreen}
        >
          <Ionicons name={isFullscreen ? "close" : "expand"} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Nearest hospital hero ────────────────────────────────────────────────────

function NearestHospitalHero({
  hospital,
  onPress,
}: {
  hospital: Hospital;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${hospital.name}, nearest hospital`}
      style={[styles.heroCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.emergencyBorder }, shadows.glowEmergency]}
    >
      <LinearGradient
        colors={[colors.emergencySubtle, 'transparent']}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
      />

      <View style={styles.heroTop}>
        <View style={[styles.nearestChip, { backgroundColor: colors.emergency }]}>
          <Ionicons name="navigate" size={10} color="#FFF" />
          <Text style={[styles.nearestChipText]}>NEAREST</Text>
        </View>
        {hospital.isEmergencyCenter && (
          <View style={[styles.emergencyChip, { backgroundColor: colors.emergencySubtle, borderColor: colors.emergencyBorder }]}>
            <Text style={[textStyles.caption, { color: colors.emergency, fontWeight: '800' }]}>24H EMERGENCY</Text>
          </View>
        )}
      </View>

      <Text style={[textStyles.headingLarge, { color: colors.textPrimary, marginTop: spacing[3] }]}>
        {hospital.name}
      </Text>
      <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
        {hospital.address}
      </Text>

      <View style={styles.heroStats}>
        <View style={[styles.distancePill, { backgroundColor: colors.accentSubtle }]}>
          <Ionicons name="navigate" size={13} color={colors.accent} />
          <Text style={[textStyles.bodySmall, { color: colors.accent, fontWeight: '700', marginLeft: spacing[1] }]}>
            {formatDistance(hospital.distanceKm)}
          </Text>
        </View>
        <Text style={[textStyles.bodySmall, { color: colors.textTertiary }]}>
          ~{hospital.etaMinutes} min away
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.iconSecondary} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Hospital list card ────────────────────────────────────────────────────────

function HospitalListCard({
  hospital,
  onPress,
  index,
  maxDistance,
}: {
  hospital: Hospital;
  onPress: () => void;
  index: number;
  maxDistance: number;
}): React.JSX.Element {
  const { colors } = useTheme();
  const isEmergency = hospital.isEmergencyCenter;
  const sType = hospital.serviceType || 'hospital';
  let accentColor = isEmergency ? colors.emergency : colors.accent;
  let cardIconName = isEmergency ? 'medical' : 'business-outline';
  if (sType === 'police') {
    accentColor = '#3B82F6';
    cardIconName = 'shield-outline';
  } else if (sType === 'towing') {
    accentColor = '#D97706';
    cardIconName = 'car-outline';
  }

  // Animated distance bar
  const barWidth = useRef(new Animated.Value(0)).current;
  const barRatio = maxDistance > 0 ? hospital.distanceKm / maxDistance : 0;
  const barColor = index === 0 ? colors.safe : index === 1 ? colors.accent : colors.textTertiary;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: barRatio,
      duration: 600,
      delay: index * 150,
      useNativeDriver: false,
    }).start();
  }, [barWidth, barRatio, index]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${hospital.name}, ${formatDistance(hospital.distanceKm)} away`}
      style={[
        styles.listCard,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.surfaceBorder,
          borderLeftColor: accentColor,
        },
        shadows.sm,
      ]}
    >
      <View style={[styles.listCardIcon, { backgroundColor: `${accentColor}15` }]}>
        <Ionicons name={cardIconName as any} size={20} color={accentColor} />
      </View>

      <View style={styles.listCardBody}>
        <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]} numberOfLines={1}>
          {hospital.name}
        </Text>
        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
          {hospital.address}
        </Text>

        <View style={styles.listCardChips}>
          <View style={[styles.distancePillSm, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="navigate-outline" size={11} color={colors.iconSecondary} />
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: 3 }]}>
              {formatDistance(hospital.distanceKm)}
            </Text>
          </View>
          <View style={[styles.distancePillSm, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="time-outline" size={11} color={colors.iconSecondary} />
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: 3 }]}>
              ~{hospital.etaMinutes} min
            </Text>
          </View>
          {isEmergency && (
            <View style={[styles.distancePillSm, { backgroundColor: colors.emergencySubtle }]}>
              <Text style={[textStyles.caption, { color: colors.emergency, fontWeight: '700' }]}>EMERGENCY</Text>
            </View>
          )}
        </View>
        {/* Animated distance bar */}
        <View style={[styles.distanceBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
          <Animated.View
            style={[
              styles.distanceBarFill,
              {
                backgroundColor: barColor,
                width: barWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.iconSecondary} style={{ flexShrink: 0 }} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NearbyHospitalsScreen(_props: HospitalsScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const nav = useAppNavigation();
  const { location: liveLoc } = useLiveLocation(true);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Locating…');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'police' | 'towing'>('all');

  // Fetch using best available location — real GPS or fallback
  const fetchHospitals = useCallback(async (lat: number, lon: number): Promise<void> => {
    setLoading(true);
    setLoadError(false);
    setLocationLabel(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    try {
      const data = await HospitalService.getNearby(
        { latitude: lat, longitude: lon },
        { maxResults: 10 },
      );
      setHospitals(data);
      setIsLiveData(HospitalService.isLiveData);
    } catch (error) {
      console.warn('[NearbyHospitalsScreen] Failed to load hospitals:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: get best location immediately without waiting for liveLoc
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    void (async () => {
      try {
        const loc = await HospitalService.getUserLocation();
        await fetchHospitals(loc.latitude, loc.longitude);
      } catch (err) {
        console.warn('[NearbyHospitalsScreen] Initial location fetch failed:', err);
        setLoading(false);
        setLoadError(true);
      }
    })();
  }, [fetchHospitals]);

  // If liveLoc updates significantly (>500m shift), refresh results
  const lastFetchLocRef = useRef<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    if (!liveLoc) return;
    const last = lastFetchLocRef.current;
    if (!last) {
      lastFetchLocRef.current = { latitude: liveLoc.latitude, longitude: liveLoc.longitude };
      void fetchHospitals(liveLoc.latitude, liveLoc.longitude);
      return;
    }
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(liveLoc.latitude - last.latitude);
    const dLon = toRad(liveLoc.longitude - last.longitude);
    const dist =
      R * 2 * Math.atan2(
        Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(toRad(last.latitude)) * Math.cos(toRad(liveLoc.latitude)) * Math.sin(dLon / 2) ** 2),
        Math.sqrt(1 - (Math.sin(dLat / 2) ** 2 + Math.cos(toRad(last.latitude)) * Math.cos(toRad(liveLoc.latitude)) * Math.sin(dLon / 2) ** 2)),
      );
    if (dist > 500) {
      lastFetchLocRef.current = { latitude: liveLoc.latitude, longitude: liveLoc.longitude };
      void fetchHospitals(liveLoc.latitude, liveLoc.longitude);
    }
  }, [liveLoc, fetchHospitals]);

  const sorted = [...hospitals].sort((a, b) => {
    if (a.isEmergencyCenter && !b.isEmergencyCenter) return -1;
    if (!a.isEmergencyCenter && b.isEmergencyCenter) return 1;
    return a.distanceKm - b.distanceKm;
  });

  const filteredSorted = sorted.filter(h => filterType === 'all' || (h.serviceType || 'hospital') === filterType);
  const nearest = filteredSorted[0];
  const rest = filteredSorted.slice(1);
  const maxDistance = Math.max(...filteredSorted.map((h) => h.distanceKm), 1);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {isMapFullscreen ? (
        <LiveMap
          userLocation={liveLoc}
          hospitals={filteredSorted}
          selectedHospitalId={selectedHospitalId}
          onHospitalSelect={(hosp) => {
            setSelectedHospitalId(hosp.id);
            nav.navigate('HospitalDetail', { hospitalId: hosp.id });
          }}
          isFullscreen={true}
          onToggleFullscreen={() => setIsMapFullscreen(false)}
        />
      ) : (
        <>
          {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[textStyles.displaySmall, { color: colors.textPrimary }]}>
            {t('home.hospitals')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 }}>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
              {loading ? 'Searching…' : `${sorted.length} found`}
            </Text>
            {!loading && (
              <View style={[
                styles.dataBadge,
                { backgroundColor: isLiveData ? colors.safeSubtle : colors.infoSubtle,
                  borderColor: isLiveData ? colors.safeMuted : colors.infoMuted },
              ]}>
                <View style={[styles.dataDot, { backgroundColor: isLiveData ? colors.safe : colors.info }]} />
                <Text style={[textStyles.caption, { color: isLiveData ? colors.safeText : colors.infoText, fontWeight: '700' }]}>
                  {isLiveData ? 'LIVE' : 'DEMO'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[3] }]}>
            Finding nearby facilities…
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="wifi-outline" size={48} color={colors.textTertiary} />
          <Text style={[textStyles.headingSmall, { color: colors.textPrimary, marginTop: spacing[4] }]}>
            Could not load hospitals
          </Text>
          <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center' }]}>
            Check your internet connection and location permission.
          </Text>
          <TouchableOpacity
            onPress={() => {
              void HospitalService.getUserLocation().then((loc) =>
                fetchHospitals(loc.latitude, loc.longitude)
              );
            }}
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={[textStyles.labelMedium, { color: '#fff', marginLeft: spacing[2] }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(h) => h.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          ListHeaderComponent={
            <>
              <LiveMap
                userLocation={liveLoc}
                hospitals={filteredSorted}
                selectedHospitalId={selectedHospitalId}
                onHospitalSelect={(hosp) => {
                  setSelectedHospitalId(hosp.id);
                  nav.navigate('HospitalDetail', { hospitalId: hosp.id });
                }}
                isFullscreen={false}
                onToggleFullscreen={() => setIsMapFullscreen(true)}
              />

              {/* Filter Pills */}
              <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setFilterType('all')} style={[styles.filterPill, filterType === 'all' && {backgroundColor: colors.textPrimary}]}>
                  <Text style={[styles.filterText, filterType === 'all' && {color: colors.bgPrimary}]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('hospital')} style={[styles.filterPill, filterType === 'hospital' && {backgroundColor: colors.textPrimary}]}>
                  <Text style={[styles.filterText, filterType === 'hospital' && {color: colors.bgPrimary}]}>Hospitals</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('police')} style={[styles.filterPill, filterType === 'police' && {backgroundColor: colors.textPrimary}]}>
                  <Text style={[styles.filterText, filterType === 'police' && {color: colors.bgPrimary}]}>Police</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('towing')} style={[styles.filterPill, filterType === 'towing' && {backgroundColor: colors.textPrimary}]}>
                  <Text style={[styles.filterText, filterType === 'towing' && {color: colors.bgPrimary}]}>Towing</Text>
                </TouchableOpacity>
              </View>

              {/* Nearest hero */}
              {nearest !== undefined && (
                <>
                  <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[5], marginBottom: spacing[3] }]}>
                    CLOSEST TO YOU
                  </Text>
                  <NearestHospitalHero
                    hospital={nearest}
                    onPress={() => {
                      setSelectedHospitalId(nearest.id);
                      nav.navigate('HospitalDetail', { hospitalId: nearest.id });
                    }}
                  />
                  <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[6], marginBottom: spacing[3] }]}>
                    OTHER HOSPITALS
                  </Text>
                </>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <HospitalListCard
              hospital={item}
              index={index}
              maxDistance={maxDistance}
              onPress={() => {
                setSelectedHospitalId(item.id);
                nav.navigate('HospitalDetail', { hospitalId: item.id });
              }}
            />
          )}
          ListFooterComponent={
            <View style={[styles.footer, { backgroundColor: colors.infoSubtle, borderColor: colors.infoMuted }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.info} />
              <Text style={[textStyles.caption, { color: colors.infoText, marginLeft: spacing[2], flex: 1 }]}>
                Results come from OpenStreetMap Overpass when online, with fallback data for demos.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.loadingWrap}>
              <Ionicons name="medical-outline" size={40} color={colors.textTertiary} />
              <Text style={[textStyles.headingSmall, { color: colors.textPrimary, marginTop: spacing[3] }]}>
                No hospitals found nearby
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center' }]}>
                Try refreshing location or increasing your movement radius.
              </Text>
            </View>
          }
        />
      )}
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MAP_HEIGHT = 200;

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontal,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    marginTop: spacing[5],
  },
  dataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    gap: spacing[1],
  },
  dataDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  list: { paddingHorizontal: layout.screenHorizontal, paddingBottom: spacing[16] },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },

  // Map
  mapWrap: {
    height: MAP_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mapWrapFullscreen: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
  },
  expandBtn: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 50,
  },
  mapLabel: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
  },
  legendBox: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    padding: spacing[2],
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
    marginBottom: spacing[2]
  },
  filterPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  // Hero card
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
    borderLeftWidth: 3,
    padding: spacing[5],
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '60%' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  nearestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    gap: spacing[1],
  },
  nearestChipText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  emergencyChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  distancePillSm: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },

  // List card
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderLeftWidth: 3,
    padding: spacing[4],
    gap: spacing[3],
  },
  listCardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listCardBody: { flex: 1 },
  listCardChips: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2], flexWrap: 'wrap' },
  distanceBarTrack: {
    height: 3,
    borderRadius: radius.full,
    marginTop: spacing[3],
    overflow: 'hidden',
  },
  distanceBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    padding: spacing[3],
    marginTop: spacing[5],
  },
  markerHospWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
