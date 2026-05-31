/**
 * RideHistoryScreen — Past rides modal
 *
 * Shows all past ride sessions from mock data.
 * Each ride card shows duration, distance, speed, and safe/crash status.
 * Pull-to-refresh placeholder for when StorageService is wired up.
 *
 * TODO (feature/local-storage): replace mockRideHistory with
 *   StorageService.getRideHistory()
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { EmptyState } from '../../components/common/EmptyState';
import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDuration, formatDistance, formatDate, formatTime } from '../../utils';
import { mockRideHistory } from '../../mock';
import type { RideSession } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { StorageService } from '../../storage/StorageService';

// ─── Ride history item ────────────────────────────────────────────────────────

function RideHistoryItem({ ride }: { ride: RideSession }): React.JSX.Element {
  const { colors } = useTheme();
  const isSafe = !ride.crashDetected;
  const durationSecs = ride.endTime
    ? Math.floor((ride.endTime - ride.startTime) / 1000)
    : 0;

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: isSafe ? colors.surfaceBorder : colors.emergencyBorder,
          borderLeftColor: isSafe ? colors.safe : colors.emergency,
        },
        shadows.sm,
      ]}
    >
      {/* Left accent bar built via borderLeftWidth */}
      <View style={styles.itemContent}>
        {/* Date + time */}
        <View style={styles.itemHeader}>
          <Text style={[textStyles.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>
            {formatDate(ride.startTime)}
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
            {formatTime(ride.startTime)}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.itemStats}>
          <View style={styles.statPair}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
              {formatDuration(durationSecs)}
            </Text>
          </View>
          <View style={styles.statPair}>
            <Ionicons name="navigate-outline" size={13} color={colors.textTertiary} />
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
              {formatDistance(ride.distanceKm ?? 0)}
            </Text>
          </View>
          <View style={styles.statPair}>
            <Ionicons name="speedometer-outline" size={13} color={colors.textTertiary} />
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginLeft: spacing[1] }]}>
              {Math.round(ride.avgSpeedKmh ?? 0)} km/h avg
            </Text>
          </View>
        </View>

        {/* Safe badge */}
        <View style={[styles.badge, { backgroundColor: isSafe ? colors.safeSubtle : colors.emergencySubtle }]}>
          <Ionicons
            name={isSafe ? 'shield-checkmark' : 'warning'}
            size={11}
            color={isSafe ? colors.safe : colors.emergency}
          />
          <Text style={[textStyles.caption, { color: isSafe ? colors.safeText : colors.emergencyText, marginLeft: 3, fontWeight: '700' }]}>
            {isSafe ? 'SAFE' : 'CRASH DETECTED'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RideHistoryScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const nav = useAppNavigation();
  const [rides, setRides] = useState<RideSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRides = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await StorageService.get<RideSession[]>(STORAGE_KEYS.RIDE_HISTORY);
    if (!result.success) {
      setLoadError('Unable to load ride history from local storage.');
      setRides(mockRideHistory);
      setLoading(false);
      return;
    }
    setRides(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRides();
  }, [loadRides]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[textStyles.headingLarge, { color: colors.textPrimary }]}>
          Ride History
        </Text>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        ListEmptyComponent={
          <EmptyState
            icon="bicycle-outline"
            title="No rides recorded"
            description="Start your first ride to see it here."
          />
        }
        renderItem={({ item }) => <RideHistoryItem ride={item} />}
        ListHeaderComponent={
          <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
            {loading
              ? 'Loading ride history...'
              : loadError
              ? `${rides.length} ride${rides.length !== 1 ? 's' : ''} · fallback data`
              : `${rides.length} ride${rides.length !== 1 ? 's' : ''} · local history`}
          </Text>
        }
        refreshing={loading}
        onRefresh={() => {
          void loadRides();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:  { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontal,
    paddingVertical: spacing[4],
    borderBottomWidth: borderWidth.hairline,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: layout.screenHorizontal,
    paddingBottom: spacing[12],
  },
  item: {
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  itemContent: {
    padding: spacing[4],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  itemStats: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
    flexWrap: 'wrap',
  },
  statPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
});
