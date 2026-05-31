/**
 * RecentRideCard — Premium Activity Feed Item
 * feature/ui-polish-home ✅
 *
 * Enhancements:
 *   - Left-border accent color signals safe vs crash instantly
 *   - Icon container tinted to match status
 *   - Distance + duration as primary, speed as secondary
 *   - Safe/crash badge right-aligned with clear color signal
 *   - Subtle shadow lifts the card off the background
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LocalizationContext';
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatDistance, formatDuration, timeAgo } from '../../utils';
import type { RideSession } from '../../types';

interface RecentRideCardProps {
  ride: RideSession;
}

export function RecentRideCard({ ride }: RecentRideCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isSafe = !ride.crashDetected;
  const durationSeconds = ride.endTime
    ? Math.floor((ride.endTime - ride.startTime) / 1000)
    : 0;

  const accentColor  = isSafe ? colors.safe      : colors.emergency;
  const iconBgColor  = isSafe ? colors.safeSubtle : colors.emergencySubtle;
  const badgeBgColor = isSafe ? colors.safeSubtle : colors.emergencySubtle;
  const badgeText    = isSafe ? colors.safeText   : colors.emergencyText;
  const icon         = isSafe ? 'shield-checkmark' : 'warning';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.surfaceBorder,
          borderLeftColor: accentColor,
        },
        shadows.sm,
      ]}
    >
      {/* Status icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={18} color={accentColor} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={[textStyles.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>
          {formatDistance(ride.distanceKm ?? 0)}
          <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
            {'  ·  '}{formatDuration(durationSeconds)}
          </Text>
        </Text>
        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {timeAgo(ride.startTime)}
          {ride.avgSpeedKmh !== undefined
            ? `  ·  ${t('home.avgSpeed')} ${Math.round(ride.avgSpeedKmh)} km/h`
            : ''}
        </Text>
      </View>

      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
        <Text style={[textStyles.caption, { color: badgeText, fontWeight: '800' }]}>
          {isSafe ? t('home.safeStatus') : t('home.crashStatus')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderLeftWidth: 3,
    padding: spacing[3],
    gap: spacing[3],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stats: { flex: 1 },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    flexShrink: 0,
  },
});
