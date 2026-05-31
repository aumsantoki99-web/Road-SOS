/**
 * HomeScreen — RideSafe Command Centre
 * feature/ui-polish-home ✅
 *
 * Redesigned as a premium safety dashboard.
 * Feels like: Tesla app meets Google Pixel Safety meets Stripe mobile.
 *
 * Layout philosophy:
 *   - Full-bleed hero gradient occupies top 40% — creates visual anchor
 *   - Safety status chip sits prominently below greeting
 *   - SOS is the gravitational centre — everything orbits it
 *   - Quick actions use an asymmetric hero+grid layout, not a flat 2×2
 *   - Activity feed uses a timeline aesthetic — feels alive
 *   - Bottom safety score card creates closure and trust
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppState } from '../../context/AppStateContext';
import { useTranslation } from '../../context/LocalizationContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useGreeting } from '../../hooks/useGreeting';
import { useFadeIn, useSlideUp } from '../../hooks/useAnimation';
import { useIsFocused } from '@react-navigation/native';

import { OfflineBanner } from '../../components/banners/OfflineBanner';
import { FloatingSOSButton } from '../../components/buttons/FloatingSOSButton';
import { RecentRideCard } from './RecentRideCard';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { HomeScreenProps } from '../../navigation/types';
import type { EmergencyContact, RideSession } from '../../types';
import { StorageService } from '../../storage/StorageService';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../constants';
import { SosService, NotificationService } from '../../services';

// ─── Safety status chip ───────────────────────────────────────────────────────

function SafetyStatusChip({ rideStatus }: { rideStatus: string }): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (rideStatus !== 'active' || !isFocused) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [rideStatus, pulseAnim, isFocused]);

  const isActive = rideStatus === 'active';
  const dotColor = isActive ? colors.safe : colors.textTertiary;
  const label    = isActive ? t('home.rideActive') : t('home.readyToRide');
  const bg       = isActive ? colors.safeSubtle : colors.surfaceSecondary;
  const border   = isActive ? colors.safeMuted   : colors.surfaceBorder;

  return (
    <View style={[styles.statusChip, { backgroundColor: bg, borderColor: border }]}>
      <Animated.View style={[styles.statusDot, { backgroundColor: dotColor, opacity: pulseAnim }]} />
      <Text style={[textStyles.labelMedium, { color: isActive ? colors.safeText : colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Quick action tile ────────────────────────────────────────────────────────

interface ActionTileProps {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  onPress: () => void;
  badge?: number;
  hero?: boolean;
}

function ActionTile({ icon, label, sublabel, color, onPress, badge, hero = false }: ActionTileProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn(): void {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  }
  function onPressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }], flex: hero ? 0 : 1, flexBasis: hero ? 'auto' : 0 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.actionTile,
          hero && styles.actionTileHero,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.surfaceBorder,
            flex: 1, // Stretch to match other tiles in the row
          },
          shadows.card,
        ]}
      >
        {/* Accent line */}
        <View style={[styles.tileAccentLine, { backgroundColor: color }]} />

        <View style={[styles.tileIconWrap, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon as 'home'} size={hero ? 26 : 22} color={color} />
        </View>

        <Text 
          style={[
            hero ? textStyles.headingMedium : textStyles.headingSmall,
            { color: colors.textPrimary, marginTop: hero ? 0 : spacing[2] }
          ]} 
          numberOfLines={1}
          adjustsFontSizeToFit={true}
        >
          {label}
        </Text>

        {sublabel !== undefined && (
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={hero ? 1 : 2}>
            {sublabel}
          </Text>
        )}

        {badge !== undefined && badge > 0 && (
          <View style={[styles.tileBadge, { backgroundColor: colors.accent }]}>
            <Text style={[textStyles.caption, { color: colors.black, fontWeight: '800' }]}>
              {badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Safety score card ────────────────────────────────────────────────────────

function SafetyScoreCard({ rideCount, contactCount, incidentCount }: { rideCount: number, contactCount: number, incidentCount: number }): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stats = [
    { value: rideCount, label: t('home.rides'), icon: 'speedometer-outline' },
    { value: contactCount,    label: t('home.contacts'), icon: 'people-outline' },
    { value: incidentCount,                      label: t('home.incidents'), icon: 'shield-checkmark-outline' },
  ];

  return (
    <View style={[
      styles.scoreCard,
      { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder },
      shadows.card,
    ]}>
      <View style={styles.scoreHeader}>
        <View>
          <Text style={[textStyles.labelCaps, { color: colors.textTertiary }]}>{t('home.safetyOverview')}</Text>
          <Text style={[textStyles.headingSmall, { color: colors.textPrimary, marginTop: spacing[1] }]}>
            {t('home.allSystemsReady')}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.safeSubtle }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.safe} />
          <Text style={[textStyles.labelMedium, { color: colors.safeText, marginLeft: spacing[1] }]}>{t('home.safe')}</Text>
        </View>
      </View>

      <View style={[styles.scoreDivider, { backgroundColor: colors.divider }]} />

      <View style={styles.scoreStats}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[styles.scoreStat, i > 0 && { borderLeftWidth: borderWidth.hairline, borderLeftColor: colors.divider }]}>
            <Text style={[textStyles.numericLarge, { color: colors.textPrimary }]}>
              {stat.value}
            </Text>
            <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Timeline activity item ───────────────────────────────────────────────────

function ActivityTimeline({ rides }: { rides: RideSession[] }): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (rides.length === 0) {
    return (
      <View style={[styles.emptyActivity, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
        <Ionicons name="bicycle-outline" size={32} color={colors.textTertiary} />
        <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[2] }]}>
          {t('home.startFirstRide')}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {rides.map((ride, i) => (
        <View key={ride.id} style={styles.timelineItem}>
          {/* Timeline spine */}
          <View style={styles.timelineLeft}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: ride.crashDetected ? colors.emergency : colors.safe }
            ]} />
            {i < rides.length - 1 && (
              <View style={[styles.timelineSpine, { backgroundColor: colors.divider }]} />
            )}
          </View>
          {/* Card */}
          <View style={{ flex: 1, paddingBottom: i < rides.length - 1 ? spacing[3] : 0 }}>
            <RecentRideCard ride={ride} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const EMPTY_CONTACTS: EmergencyContact[] = [];
const EMPTY_RIDES: RideSession[] = [];

export function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const { colors, isDark, isNight } = useTheme();
  const { t } = useTranslation();
  const { state } = useAppState();
  const nav = useAppNavigation();
  const { period, isNightRide } = useGreeting();
  const greeting = period === 'morning'
    ? t('home.goodMorning')
    : period === 'afternoon'
    ? t('home.goodAfternoon')
    : period === 'evening'
    ? t('home.goodEvening')
    : t('home.helloRider');

  const [isOffline]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const isFocused = useIsFocused();

  // Entrance animations
  const headerFade = useFadeIn(400, 100);
  const contentSlide = useSlideUp(20, 500, 200);

  useEffect(() => {
    headerFade.start();
    contentSlide.start();
  }, [headerFade, contentSlide]);

  useEffect(() => {
    async function checkMedicalId() {
      const result = await StorageService.get<string>(STORAGE_KEYS.PROFILE_SETUP_DONE);
      const isSetup = result.success && result.data === 'true';
      const hasNeverSetup = !result.success || result.data === null || result.data === undefined;

      setProfileComplete(isSetup);
    }

    if (isFocused) {
      void checkMedicalId();
    }
  }, [isFocused, nav]);

  const { data: contactsData, refresh: refreshContacts } = useStorage<EmergencyContact[]>(STORAGE_KEYS.CONTACTS, EMPTY_CONTACTS);
  const { data: ridesData, refresh: refreshRides } = useStorage<RideSession[]>(STORAGE_KEYS.RIDE_HISTORY, EMPTY_RIDES);

  useEffect(() => {
    if (isFocused) {
      void refreshContacts();
      void refreshRides();
    }
  }, [isFocused, refreshContacts, refreshRides]);

  const currentRide  = state.currentRide;
  const rideStatus   = currentRide?.status ?? 'idle';
  const contactCount = contactsData ? contactsData.length : 0;
  const rideCount    = ridesData ? ridesData.length : 0;
  const recentRides  = ridesData ? ridesData.slice(0, 3) : [];
  const incidentCount = ridesData ? ridesData.filter(r => r.crashDetected).length : 0;

  // Hero gradient — shifts with time of day
  const heroColors: [string, string, string] = isNight
    ? ['#1A0303', '#0D0101', '#080000']
    : isDark
    ? [colors.bgElevated, colors.bgSecondary, colors.bgPrimary]
    : ['#FFFFFF', '#F8FAFC', '#F1F5F9'];

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await Promise.all([refreshContacts(), refreshRides()]);
    setRefreshing(false);
  }

  return (
    <View style={styles.root}>
      {/* Full-screen layered background */}
      <LinearGradient
        colors={heroColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <OfflineBanner
          visible={isOffline}
          state="offline"
          onViewDetails={() => nav.navigate('OfflineMode')}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {/* ── Hero header ────────────────────────────────────────────── */}
          <Animated.View style={[styles.hero, { opacity: headerFade.opacity }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={[textStyles.labelCaps, { color: colors.accent, marginBottom: spacing[1] }]}>
                  {t('home.title').toUpperCase()}
                </Text>
                <Text style={[textStyles.displayMedium, { color: colors.textPrimary }]}>
                  {greeting}
                </Text>
              </View>

              {/* Avatar */}
              <TouchableOpacity
                style={[styles.avatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}
                accessibilityLabel="Profile settings"
                accessibilityRole="button"
                onPress={() => props.navigation.navigate('Profile')}
              >
                <Ionicons name="person" size={20} color={colors.iconSecondary} />
                {/* Online indicator */}
                <View style={[styles.avatarOnline, { backgroundColor: colors.safe, borderColor: colors.bgPrimary }]} />
              </TouchableOpacity>
            </View>

            {/* Safety status chip */}
            <SafetyStatusChip rideStatus={rideStatus} />

            {/* Night mode badge */}
            {isNightRide && (
              <View style={[styles.nightBadge, { backgroundColor: '#1A0505', borderColor: '#3D0A0A' }]}>
                <Ionicons name="moon" size={12} color="#FF8080" />
                <Text style={[textStyles.caption, { color: '#FF8080', marginLeft: spacing[1] }]}>
                  {t('settings.nightModeActive')}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── SOS hero section ────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.sosSection,
              {
                opacity: contentSlide.opacity,
                transform: [{ translateY: contentSlide.translateY }],
              }
            ]}
          >
            {/* SOS context label */}
            <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
              {t('home.emergency')}
            </Text>

            <FloatingSOSButton size="hero" onPress={() => {
              nav.navigate('SOSConfirmation' as never);
            }} />

            <View style={styles.sosMeta}>
              <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
              <Text style={[textStyles.caption, { color: colors.textTertiary, marginLeft: spacing[1] }]}>
                {contactCount} {t('home.contactsAlerted')}
              </Text>
            </View>
          </Animated.View>

          {/* ── Profile Incomplete Warning Banner ──────────────────────── */}
          {profileComplete === false && (
            <Animated.View
              style={[
                styles.warningBanner,
                {
                  opacity: contentSlide.opacity,
                  transform: [{ translateY: contentSlide.translateY }],
                  backgroundColor: `${colors.emergency}14`,
                  borderColor: `${colors.emergency}36`,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => nav.navigate('Profile')}
                style={styles.warningBannerContent}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle" size={24} color={colors.emergency} />
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                  <Text style={[textStyles.headingSmall, { color: colors.emergency }]}>
                    {t('home.actionRequired')}
                  </Text>
                  <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                    {t('home.completeProfile')}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.emergency} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Quick actions — asymmetric hero layout ──────────────────── */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: contentSlide.opacity,
                transform: [{ translateY: contentSlide.translateY }],
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[textStyles.labelCaps, { color: colors.textTertiary }]}>{t('home.quickActions')}</Text>
            </View>

            {/* Hero action — Start/Stop Ride — full width */}
            <ActionTile
              icon={rideStatus === 'active' ? 'stop-circle' : 'speedometer'}
              label={rideStatus === 'active' ? t('home.stopRide') : t('home.startRide')}
              sublabel={rideStatus === 'active' ? t('home.monitoringActive') : t('home.beginMonitoring')}
              color={rideStatus === 'active' ? colors.emergency : colors.safe}
              onPress={() => nav.navigate('Ride' as never)}
              hero
            />

            <View style={{ height: spacing[3] }} />

            {/* Secondary row */}
            <View style={styles.actionRow}>
              <ActionTile
                icon="people"
                label={t('home.contacts')}
                sublabel={`${contactCount} ${t('home.contactsCount')}`}
                color={colors.accent}
                onPress={() => nav.navigate('Contacts' as never)}
                badge={contactCount}
              />
              <View style={{ width: spacing[3] }} />
              <ActionTile
                icon="medical"
                label={t('home.hospitals')}
                sublabel={t('home.nearestHospital')}
                color="#EF4444"
                onPress={() => nav.navigate('Hospitals' as never)}
              />
              <View style={{ width: spacing[3] }} />
              <ActionTile
                icon="cloud-offline"
                label={t('home.offline')}
                sublabel={isOffline ? t('home.active') : t('home.ready')}
                color={colors.info}
                onPress={() => nav.navigate('OfflineMode')}
              />
            </View>
          </Animated.View>

          {/* ── Safety overview card ────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: contentSlide.opacity,
                transform: [{ translateY: contentSlide.translateY }],
              }
            ]}
          >
            <SafetyScoreCard rideCount={rideCount} contactCount={contactCount} incidentCount={incidentCount} />
          </Animated.View>

          {/* ── Activity timeline ───────────────────────────────────────── */}
          <Animated.View
            style={{
              opacity: contentSlide.opacity,
              transform: [{ translateY: contentSlide.translateY }],
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={[textStyles.labelCaps, { color: colors.textTertiary }]}>
                {t('home.recentRides')}
              </Text>
              {recentRides.length > 0 && (
                <TouchableOpacity
                  onPress={() => nav.navigate('RideHistory')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[textStyles.labelMedium, { color: colors.accent }]}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <ActivityTimeline rides={recentRides} />
          </Animated.View>

          <View style={{ height: spacing[16] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1 },
  safeArea: { flex: 1 },
  scroll:   { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontal,
    paddingBottom: spacing[8],
  },

  // Hero header
  hero: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  heroText: { flex: 1, paddingRight: spacing[4] },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,
    position: 'relative',
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    borderWidth: 2,
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },

  nightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    gap: spacing[1],
  },

  // SOS section
  sosSection: {
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  sosMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
  },

  // Actions
  section: { marginBottom: spacing[6] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  actionRow: { flexDirection: 'row' },

  actionTile: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
    paddingTop: spacing[5],
    overflow: 'hidden',
    position: 'relative',
    minHeight: 116,
  },
  actionTileHero: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
  },
  tileAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },

  // Safety score
  scoreCard: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[5],
    overflow: 'hidden',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    gap: spacing[1],
  },
  scoreDivider: { height: borderWidth.hairline, marginBottom: spacing[4] },
  scoreStats: { flexDirection: 'row' },
  scoreStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[1],
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  timelineLeft: {
    alignItems: 'center',
    width: 16,
    paddingTop: spacing[4],
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  timelineSpine: {
    width: 2,
    flex: 1,
    marginTop: spacing[1],
    borderRadius: radius.full,
    minHeight: spacing[4],
  },

  // Empty activity
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    borderStyle: 'dashed',
  },
  warningBanner: {
    marginBottom: spacing[6],
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
    overflow: 'hidden',
  },
  warningBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
});
