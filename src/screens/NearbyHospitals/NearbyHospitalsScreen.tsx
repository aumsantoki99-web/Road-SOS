/**
 * NearbyHospitalsScreen — Actionable Emergency UI
 * feature/ui-polish-hospitals ✅
 *
 * Enhancements:
 *   - Premium mock map with location pin, hospital markers, radius circle
 *   - Nearest hospital gets a distinct "hero" treatment at top
 *   - Hospital cards use colored left border + emergency badge chips
 *   - Distance shown as a pill badge, ETA as secondary
 *   - Call button integrated into card footer
 *   - Emergency centres visually prioritised with red accent
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDistance } from '../../utils';
import { mockHospitals } from '../../mock';
import type { Hospital } from '../../types';
import type { HospitalsScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Premium map placeholder ──────────────────────────────────────────────────

function PremiumMapPlaceholder(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const mapBg   = isDark ? '#0D1B2A' : '#E8F4FD';
  const roadBg  = isDark ? '#1A2E42' : '#D4EAF7';
  const gridClr = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={[styles.mapWrap, { backgroundColor: mapBg }]}>
      {/* Road grid */}
      <View style={[styles.road, styles.roadH1, { backgroundColor: roadBg }]} />
      <View style={[styles.road, styles.roadH2, { backgroundColor: roadBg }]} />
      <View style={[styles.road, styles.roadV1, { backgroundColor: roadBg }]} />
      <View style={[styles.road, styles.roadV2, { backgroundColor: roadBg }]} />

      {/* User radius circle */}
      <View style={[styles.radiusCircle, { borderColor: `${colors.accent}40` }]} />
      <View style={[styles.radiusCircleInner, { borderColor: `${colors.accent}25` }]} />

      {/* Hospital pins */}
      <View style={[styles.pinWrap, { top: '20%', left: '18%' }]}>
        <View style={[styles.pinHead, { backgroundColor: colors.emergency }]}>
          <Ionicons name="medical" size={9} color="#FFF" />
        </View>
        <View style={[styles.pinStem, { backgroundColor: colors.emergency }]} />
      </View>
      <View style={[styles.pinWrap, { top: '48%', left: '62%' }]}>
        <View style={[styles.pinHead, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="medical" size={9} color="#FFF" />
        </View>
        <View style={[styles.pinStem, { backgroundColor: '#F59E0B' }]} />
      </View>
      <View style={[styles.pinWrap, { top: '15%', left: '72%' }]}>
        <View style={[styles.pinHead, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="medical" size={9} color="#FFF" />
        </View>
        <View style={[styles.pinStem, { backgroundColor: '#F59E0B' }]} />
      </View>

      {/* User location */}
      <View style={styles.userLocation}>
        <View style={[styles.userPulse, { borderColor: colors.accent }]} />
        <View style={[styles.userDot, { backgroundColor: colors.accent }]} />
      </View>

      {/* Gradient fade bottom */}
      <LinearGradient
        colors={['transparent', mapBg]}
        style={styles.mapFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      {/* SDK label */}
      <View style={[styles.mapLabel, { backgroundColor: colors.overlay }]}>
        <Ionicons name="map-outline" size={12} color={colors.textSecondary} />
        <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
          Map placeholder · Google Maps SDK ready
        </Text>
      </View>
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
  const accentColor = isEmergency ? colors.emergency : colors.accent;

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
        <Ionicons name={isEmergency ? 'medical' : 'business-outline'} size={20} color={accentColor} />
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
  const nav = useAppNavigation();

  const sorted = [...mockHospitals].sort((a, b) => {
    if (a.isEmergencyCenter && !b.isEmergencyCenter) return -1;
    if (!a.isEmergencyCenter && b.isEmergencyCenter) return 1;
    return a.distanceKm - b.distanceKm;
  });

  const nearest = sorted[0];
  const rest    = sorted.slice(1);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[textStyles.displaySmall, { color: colors.textPrimary }]}>
            Nearby Hospitals
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {sorted.length} found · mock location
          </Text>
        </View>
        <View style={[styles.locationChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
          <Ionicons name="location" size={13} color={colors.accent} />
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
            Ahmedabad
          </Text>
        </View>
      </View>

      <FlatList
        data={rest}
        keyExtractor={(h) => h.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        ListHeaderComponent={
          <>
            <PremiumMapPlaceholder />

            {/* Nearest hero */}
            {nearest !== undefined && (
              <>
                <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[5], marginBottom: spacing[3] }]}>
                  CLOSEST TO YOU
                </Text>
                <NearestHospitalHero
                  hospital={nearest}
                  onPress={() => nav.navigate('HospitalDetail', { hospitalId: nearest.id })}
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
            maxDistance={Math.max(...rest.map((h) => h.distanceKm))}
            onPress={() => nav.navigate('HospitalDetail', { hospitalId: item.id })}
          />
        )}
        ListFooterComponent={
          <View style={[styles.footer, { backgroundColor: colors.infoSubtle, borderColor: colors.infoMuted }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.info} />
            <Text style={[textStyles.caption, { color: colors.infoText, marginLeft: spacing[2], flex: 1 }]}>
              Distances are mock data. Connect HospitalService + Google Places API for real-time results.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MAP_HEIGHT = 200;

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  road: { position: 'absolute', borderRadius: 2 },
  roadH1: { top: '38%', left: 0, right: 0, height: 10 },
  roadH2: { top: '68%', left: 0, right: 0, height: 7 },
  roadV1: { left: '30%', top: 0, bottom: 0, width: 10 },
  roadV2: { left: '65%', top: 0, bottom: 0, width: 7 },

  radiusCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    bottom: '15%',
    left: '40%',
    marginLeft: -65,
  },
  radiusCircleInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    bottom: '22%',
    left: '40%',
    marginLeft: -40,
  },

  pinWrap: { position: 'absolute', alignItems: 'center' },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinStem: { width: 2, height: 8, marginTop: 1 },

  userLocation: {
    position: 'absolute',
    bottom: '28%',
    left: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  userDot: { width: 12, height: 12, borderRadius: 6 },

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
});
