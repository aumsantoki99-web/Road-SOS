/**
 * OfflineModeScreen — Resilient, Trustworthy, Not an Error State
 * feature/ui-polish-offline ✅
 *
 * Enhancements:
 *   - Hero status card with large icon and reassuring copy
 *   - Online state feels positive — not just "not offline"
 *   - Offline state uses warm amber, not harsh red
 *   - Queue items use a timeline aesthetic
 *   - Cached data shown as capability cards — "what you still have"
 *   - Sync action button has clear progress state
 *   - Messaging is reassuring: "RideSafe has you covered"
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
} from 'react-native';import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { QueueService } from '../../storage/QueueService';

import { AppHeader } from '../../components/common/AppHeader';
import { CustomButton } from '../../components/common/CustomButton';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { timeAgo } from '../../utils';
import type { QueuedAlert } from '../../types';

// ─── Connection hero card ─────────────────────────────────────────────────────

function ConnectionHero({
  isConnected,
  lastChecked,
  onRecheck,
}: {
  isConnected: boolean;
  lastChecked: number | null;
  onRecheck: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (!isConnected) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isConnected]);

  const bg      = isConnected ? colors.safeSubtle    : colors.warningSubtle;
  const border  = isConnected ? colors.safeMuted     : colors.warningMuted;
  const iconBg  = isConnected ? colors.safe          : colors.warning;
  const icon    = isConnected ? 'wifi'               : 'cloud-offline';
  const title   = isConnected ? 'You\'re online'     : 'Offline mode active';
  const subtitle = isConnected
    ? `RideSafe is fully connected${lastChecked !== null ? ` · ${timeAgo(lastChecked)}` : ''}`
    : 'Emergency features work without internet';

  return (
    <View style={[styles.heroCard, { backgroundColor: bg, borderColor: border }]}>
      <LinearGradient
        colors={isConnected ? [colors.safeSubtle, 'transparent'] : [colors.warningSubtle, 'transparent']}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
      />

      <View style={styles.heroLeft}>
        {/* Icon with pulse ring */}
        <View style={styles.heroIconWrap}>
          {isConnected && (
            <Animated.View
              style={[styles.heroPulseRing, { borderColor: colors.safe, opacity: pulseAnim }]}
            />
          )}
          <View style={[styles.heroIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={28} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.heroText}>
          <Text style={[textStyles.headingMedium, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRecheck}
        style={[styles.recheckBtn, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }]}
        accessibilityRole="button"
        accessibilityLabel="Check connection now"
      >
        <Ionicons name="refresh" size={16} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Queue timeline item ──────────────────────────────────────────────────────

function QueueTimelineItem({
  item,
  isLast,
}: {
  item: QueuedAlert;
  isLast: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();

  const statusConfig = {
    pending:  { color: colors.warning,   label: 'Pending',  icon: 'time-outline' },
    syncing:  { color: colors.info,      label: 'Syncing',  icon: 'sync-outline' },
    failed:   { color: colors.emergency, label: 'Failed',   icon: 'alert-circle-outline' },
    synced:   { color: colors.safe,      label: 'Synced',   icon: 'checkmark-circle-outline' },
  } as const;

  const typeLabel: Record<QueuedAlert['type'], string> = {
    crash: 'Crash Alert', sos: 'SOS Alert',
    ride_start: 'Ride Start', ride_end: 'Ride End',
  };

  const cfg = statusConfig[item.status];

  return (
    <View style={styles.timelineRow}>
      {/* Spine */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: cfg.color }]} />
        {!isLast && <View style={[styles.timelineSpine, { backgroundColor: colors.divider }]} />}
      </View>

      {/* Content */}
      <View style={[styles.timelineContent, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }, shadows.xs]}>
        <View style={styles.timelineContentTop}>
          <Text style={[textStyles.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>
            {typeLabel[item.type]}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: `${cfg.color}18` }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[textStyles.caption, { color: cfg.color, fontWeight: '700', marginLeft: 3 }]}>
              {cfg.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {timeAgo(item.createdAt)}
          {item.retryCount > 0 ? ` · ${item.retryCount} retries` : ''}
        </Text>
      </View>
    </View>
  );
}

// ─── Capability card ──────────────────────────────────────────────────────────

function CapabilityCard({
  icon,
  label,
  description,
  available,
}: {
  icon: string;
  label: string;
  description: string;
  available: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={[
      styles.capCard,
      { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder },
    ]}>
      <View style={[styles.capIcon, { backgroundColor: available ? colors.safeSubtle : colors.surfaceSecondary }]}>
        <Ionicons name={icon as 'wifi'} size={18} color={available ? colors.safe : colors.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>{label}</Text>
        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]}>{description}</Text>
      </View>
      <View style={[styles.capBadge, { backgroundColor: available ? colors.safeSubtle : colors.surfaceSecondary }]}>
        <Ionicons name={available ? 'checkmark' : 'remove'} size={12} color={available ? colors.safe : colors.textTertiary} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OfflineModeScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { isConnected, lastChecked, recheck } = useNetwork();

  const [queue,      setQueue]      = useState<QueuedAlert[]>([]);
  const [isFlushing, setFlushing]   = useState(false);
  const [syncDone,   setSyncDone]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;

  async function loadQueue(): Promise<void> {
    const items = await QueueService.getAll();
    setQueue(items);
  }

  useEffect(() => { void loadQueue(); }, []);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    recheck();
    await loadQueue();
    setRefreshing(false);
  }

  async function handleFlush(): Promise<void> {
    if (!isConnected) return;
    setFlushing(true);
    setSyncDone(false);
    progressAnim.setValue(0);

    // Animate progress bar during flush
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false,
    }).start();

    await QueueService.flush();
    await loadQueue();

    // Complete and show checkmark
    progressAnim.setValue(1);
    setFlushing(false);
    setSyncDone(true);

    Animated.spring(checkScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 14,
    }).start();

    setTimeout(() => {
      setSyncDone(false);
      checkScale.setValue(0);
    }, 2200);
  }

  async function handleClear(): Promise<void> {
    await QueueService.clearAll();
    await loadQueue();
  }

  const pendingCount = queue.filter((i) => i.status === 'pending' || i.status === 'failed').length;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <AppHeader title="Offline Mode" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ── Connection hero ──────────────────────────────────────────── */}
        <ConnectionHero
          isConnected={isConnected}
          lastChecked={lastChecked}
          onRecheck={recheck}
        />

        {/* ── Reassurance note ─────────────────────────────────────────── */}
        <View style={[styles.reassureCard, { backgroundColor: colors.accentSubtle, borderColor: colors.accentMuted }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          <Text style={[textStyles.bodySmall, { color: colors.accentText, marginLeft: spacing[3], flex: 1, lineHeight: 20 }]}>
            RideSafe has you covered. Emergency contacts, nearby hospital data, and SOS alerts are all available offline.
          </Text>
        </View>

        {/* ── Available offline capabilities ───────────────────────────── */}
        <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
          AVAILABLE OFFLINE
        </Text>
        <View style={styles.capGrid}>
          <CapabilityCard icon="people-outline"   label="Emergency Contacts" description="Stored locally"         available />
          <CapabilityCard icon="medical-outline"  label="Hospital Data"      description="Last cached results"    available />
          <CapabilityCard icon="warning-outline"  label="SOS Alerts"         description="Queued and sent later"  available />
          <CapabilityCard icon="map-outline"      label="Live GPS Routing"   description="Requires connection"    available={false} />
        </View>

        {/* ── Pending queue ────────────────────────────────────────────── */}
        <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginTop: spacing[6], marginBottom: spacing[3] }]}>
          PENDING ALERTS {pendingCount > 0 && `(${pendingCount})`}
        </Text>

        {queue.length === 0 ? (
          <View style={[styles.emptyQueue, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.safe} />
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              Queue is clear · Nothing to sync
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.timeline}>
              {queue.map((item, i) => (
                <QueueTimelineItem key={item.id} item={item} isLast={i === queue.length - 1} />
              ))}
            </View>

            <View style={styles.queueActions}>
              {isFlushing ? (
                <View style={[styles.progressWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.safe,
                          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: spacing[2] }]}>
                    Syncing alerts...
                  </Text>
                </View>
              ) : syncDone ? (
                <View style={[styles.syncDoneWrap, { backgroundColor: colors.safeSubtle }]}>
                  <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.safe} />
                  </Animated.View>
                  <Text style={[textStyles.bodySmall, { color: colors.safeText, marginLeft: spacing[2], fontWeight: '600' }]}>
                    Sync complete
                  </Text>
                </View>
              ) : (
                <CustomButton
                  label={`Sync ${pendingCount} Alert${pendingCount !== 1 ? 's' : ''}`}
                  onPress={() => void handleFlush()}
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={false}
                  disabled={!isConnected || pendingCount === 0}
                  iconLeft="cloud-upload"
                />
              )}
              {!isFlushing && !syncDone && (
                <>
                  <View style={{ height: spacing[2] }} />
                  <CustomButton
                    label="Clear Queue"
                    onPress={() => void handleClear()}
                    variant="ghost"
                    size="md"
                    fullWidth
                  />
                </>
              )}
            </View>
          </>
        )}

        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: layout.screenHorizontal, paddingTop: spacing[3], gap: spacing[4] },

  // Hero card
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '70%' },
  heroLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing[4] },
  heroIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  heroPulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  recheckBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,
    flexShrink: 0,
  },

  // Reassurance
  reassureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
  },

  // Capabilities
  capGrid:  { gap: spacing[2] },
  capCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    padding: spacing[3],
    gap: spacing[3],
  },
  capIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  capBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Queue timeline
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  timelineLeft: { alignItems: 'center', width: 24, paddingTop: spacing[4] },
  timelineDot:  { width: 10, height: 10, borderRadius: radius.full, flexShrink: 0 },
  timelineSpine: { width: 2, flex: 1, marginTop: spacing[1], minHeight: spacing[4], borderRadius: radius.full },
  timelineContent: {
    flex: 1,
    marginLeft: spacing[3],
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  timelineContentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },

  queueActions: { marginTop: spacing[3] },
  progressWrap: {
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  syncDoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
  },

  emptyQueue: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    borderStyle: 'dashed',
  },
});
