/**
 * HospitalDetailScreen — Premium Hospital Detail Modal
 * feature/ui-polish-hospitals ✅
 *
 * Enhancements:
 *   - Full-bleed gradient hero with hospital name overlaid
 *   - Emergency centre badge prominently placed
 *   - Distance + ETA shown as large stat chips
 *   - Specialty tags with icons
 *   - Call button is full-width primary — the most important action
 *   - Directions button styled as secondary
 *   - Smooth slide-up entrance animation
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { CustomButton } from '../../components/common/CustomButton';
import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDistance } from '../../utils';
import { HospitalService } from '../../services';
import type { Hospital } from '../../types';
import type { HospitalDetailScreenProps } from '../../navigation/types';

export function HospitalDetailScreen({ route }: HospitalDetailScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const nav        = useAppNavigation();
  const { hospitalId } = route.params;
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null);

  const slideAnim  = useRef(new Animated.Value(40)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  useEffect(() => {
    let mounted = true;

    async function loadHospital(): Promise<void> {
      try {
        const result = await HospitalService.getById(hospitalId);
        if (!mounted) return;
        setHospital(result);

        // Recalculate real distance from current GPS
        if (result?.latitude && result?.longitude) {
          try {
            const userLoc = await HospitalService.getUserLocation();
            const dist = HospitalService.haversineKm(userLoc, {
              latitude: result.latitude,
              longitude: result.longitude,
            });
            if (mounted) setLiveDistanceKm(Math.round(dist * 100) / 100);
          } catch (_) {
            // keep stored distanceKm as fallback
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadHospital();
    return () => { mounted = false; };
  }, [hospitalId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.notFound, { backgroundColor: colors.bgSecondary }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!hospital) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgSecondary }]} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={[textStyles.headingMedium, { color: colors.textPrimary, marginTop: spacing[4] }]}>
            Hospital not found
          </Text>
          <View style={{ marginTop: spacing[6] }}>
            <CustomButton label="Go Back" onPress={() => nav.goBack()} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const resolvedHospital = hospital;
  const isEmergency = hospital.isEmergencyCenter;

  // Best available distance
  const displayDistanceKm = liveDistanceKm ?? resolvedHospital.distanceKm;
  const displayEta = Math.max(3, Math.round((displayDistanceKm / 30) * 60));

  // Phone — use stored number or fallback to 108 (Indian ambulance)
  const hasPhone = Boolean(resolvedHospital.phone?.trim());
  const displayPhone = hasPhone ? resolvedHospital.phone.trim() : '108';

  function handleCall(): void {
    const url = `tel:${displayPhone}`;
    Linking.canOpenURL(url)
      .then((ok) => {
        if (ok) void Linking.openURL(url);
        else Alert.alert('Cannot call', 'Phone calls are not supported on this device.');
      })
      .catch(() => Alert.alert('Error', 'Could not initiate call.'));
  }

  function openExternalDirections(): void {
    const lat = resolvedHospital.latitude;
    const lon = resolvedHospital.longitude;

    if (!lat || !lon) {
      // No coordinates — fall back to address search
      const query = encodeURIComponent(resolvedHospital.name + ' ' + resolvedHospital.address);
      void Linking.openURL(`https://www.google.com/maps/search/?api=1&query= ${query}`);
      return;
    }

    // Direct Google Maps navigation (or native fallback)
    const googleMapsApp  = `google.navigation:q=${lat},${lon}&mode=d`;
    const googleMapsWeb  = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    const appleMaps      = `maps://?daddr=${lat},${lon}&dirflg=d`;

    Linking.canOpenURL(googleMapsApp)
      .then((canGoogle) => {
        if (canGoogle) return Linking.openURL(googleMapsApp);
        return Linking.canOpenURL(appleMaps).then((canApple) => {
          if (canApple) return Linking.openURL(appleMaps);
          return Linking.openURL(googleMapsWeb);
        });
      })
      .catch(() => void Linking.openURL(googleMapsWeb));
  }

  function handleDirections(): void {
    Alert.alert(
      'Emergency Navigation',
      'Select your navigation mode:',
      [
        {
          text: '⚡ Premium In-App Navigation',
          onPress: () => {
            nav.navigate('InAppNavigation', { hospitalId: resolvedHospital.id });
          },
        },
        {
          text: '🌐 External Maps (Google/Apple)',
          onPress: () => {
            openExternalDirections();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgSecondary }]} edges={['top', 'bottom']}>
      {/* ── Modal handle ──────────────────────────────────────────────── */}
      <View style={styles.handleBar}>
        <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={18} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <View style={[styles.hero, { overflow: 'hidden', borderColor: isEmergency ? colors.emergencyBorder : colors.surfaceBorder }]}>
            <LinearGradient
              colors={isEmergency
                ? [colors.emergencyMuted, colors.bgElevated]
                : [colors.surfaceSecondary, colors.bgElevated]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Icon */}
            <View style={[styles.heroIcon, { backgroundColor: isEmergency ? colors.emergency : colors.accent }]}>
              <Ionicons name={isEmergency ? 'medical' : 'business'} size={28} color="#FFFFFF" />
            </View>

            {/* Emergency badge */}
            {isEmergency && (
              <View style={[styles.emergencyBadge, { backgroundColor: colors.emergency }]}>
                <Text style={styles.emergencyBadgeText}>24H EMERGENCY</Text>
              </View>
            )}

            {/* Name */}
            <Text style={[textStyles.displaySmall, { color: colors.textPrimary, marginTop: spacing[4] }]}>
              {resolvedHospital.name}
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[1] }]} numberOfLines={2}>
              {resolvedHospital.address}
            </Text>

            {/* Stat chips row */}
            <View style={styles.statChips}>
              <View style={[styles.statChip, { backgroundColor: colors.accentSubtle, borderColor: colors.accentMuted }]}>
                <Ionicons name="navigate" size={14} color={colors.accent} />
                <Text style={[textStyles.headingSmall, { color: colors.accent, marginLeft: spacing[1] }]}>
                  {formatDistance(displayDistanceKm)}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[textStyles.headingSmall, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
                  ~{displayEta} min
                </Text>
              </View>
            </View>
          </View>

          {/* ── Contact ───────────────────────────────────────────────── */}
          <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[5], marginBottom: spacing[3] }]}>
            CONTACT
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }, shadows.sm]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: colors.safeSubtle }]}>
                <Ionicons name="call-outline" size={16} color={colors.safe} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.caption, { color: colors.textTertiary }]}>Phone</Text>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, marginTop: 1 }]}>
                  {hasPhone ? displayPhone : '108 (National Ambulance)'}
                </Text>
                {!hasPhone && (
                  <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                    No direct number listed — dial 108
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.callInlineBtn, { backgroundColor: colors.safe }]}
                accessibilityLabel={hasPhone ? 'Call hospital' : 'Call ambulance 108'}
                accessibilityRole="button"
              >
                <Ionicons name="call" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="location-outline" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.caption, { color: colors.textTertiary }]}>Address</Text>
                <Text style={[textStyles.bodySmall, { color: colors.textPrimary, marginTop: 1 }]}>
                  {hospital.address}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Specialties ───────────────────────────────────────────── */}
          <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[5], marginBottom: spacing[3] }]}>
            SPECIALTIES
          </Text>
          <View style={styles.specialties}>
            {hospital.specialties.map((s) => (
              <View key={s} style={[styles.specialtyChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
                <Ionicons name="medical-outline" size={12} color={colors.iconSecondary} />
                <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginLeft: spacing[1] }]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* ── Active navigation badge ──────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => nav.navigate('InAppNavigation', { hospitalId: resolvedHospital.id })}
            activeOpacity={0.8}
            style={[styles.activeNavBadge, { backgroundColor: colors.safeSubtle, borderColor: colors.safeMuted, flexDirection: 'row', alignItems: 'center' }]}
          >
            <Ionicons name="shield-checkmark" size={14} color={colors.safe} />
            <Text style={[textStyles.caption, { color: colors.safeText, marginLeft: spacing[2], flex: 1 }]}>
              ROADSoS Premium In-App Emergency Navigation is active (Tap to Start)
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.safe} />
          </TouchableOpacity>

          <View style={{ height: spacing[24] }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Sticky action footer ──────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: colors.bgSecondary, borderTopColor: colors.divider }]}>
        <View style={styles.footerRow}>
          <View style={styles.directionsBtn}>
            <CustomButton
              label="Directions"
              onPress={handleDirections}
              variant="secondary"
              size="lg"
              fullWidth
              iconLeft="navigate-outline"
            />
          </View>
          <View style={styles.callBtn}>
            <CustomButton
              label="Call Now"
              onPress={handleCall}
              variant={isEmergency ? 'danger' : 'primary'}
              size="lg"
              fullWidth
              iconLeft="call"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenHorizontal,
    paddingBottom: spacing[6],
  },

  handleBar: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    paddingHorizontal: layout.screenHorizontal,
    position: 'relative',
  },
  handle: { width: 36, height: 4, borderRadius: radius.full, marginBottom: spacing[2] },
  closeBtn: {
    position: 'absolute',
    right: layout.screenHorizontal,
    top: spacing[3],
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[5],
    marginTop: spacing[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  emergencyBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statChips: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },

  infoCard: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
    paddingVertical: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  callInlineBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowDivider: { height: borderWidth.hairline, marginHorizontal: spacing[4] },

  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },

  activeNavBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    padding: spacing[3],
    marginTop: spacing[5],
  },

  footer: {
    padding: layout.screenHorizontal,
    borderTopWidth: borderWidth.hairline,
  },
  footerRow:     { flexDirection: 'row', gap: spacing[3] },
  directionsBtn: { flex: 1 },
  callBtn:       { flex: 1 },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontal,
  },
});
