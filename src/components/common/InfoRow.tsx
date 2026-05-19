/**
 * InfoRow — Label / Value display row
 *
 * Used in: hospital detail, ride summary, settings display rows.
 * Clean two-column layout. Value can be plain text, a badge, or a custom node.
 *
 * Usage:
 *   <InfoRow label="Distance" value="3.7 km" />
 *   <InfoRow label="Status" value="Active" valueBadge="safe" />
 *   <InfoRow label="Phone" value="+91 98765 43210" onPress={handleCall} />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'safe' | 'warning' | 'danger' | 'info' | 'neutral';

export interface InfoRowProps {
  label: string;
  value: string;
  /** If set, renders value inside a coloured badge */
  valueBadge?: BadgeVariant;
  /** If set, makes the row tappable with a chevron */
  onPress?: () => void;
  /** Icon shown to the left of the label */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Show a hairline divider below this row */
  showDivider?: boolean;
}

// ─── Badge colors ─────────────────────────────────────────────────────────────

function useBadgeColors(variant: BadgeVariant) {
  const { colors } = useTheme();
  const map: Record<BadgeVariant, { bg: string; text: string }> = {
    safe:    { bg: colors.safeSubtle,     text: colors.safeText },
    warning: { bg: colors.warningSubtle,  text: colors.warningText },
    danger:  { bg: colors.emergencySubtle, text: colors.emergencyText },
    info:    { bg: colors.infoSubtle,     text: colors.infoText },
    neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  };
  return map[variant];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfoRow({
  label,
  value,
  valueBadge,
  onPress,
  icon,
  showDivider = false,
}: InfoRowProps): React.JSX.Element {
  const { colors } = useTheme();
  const badgeColors = valueBadge !== undefined ? useBadgeColors(valueBadge) : null;

  const content = (
    <View style={styles.row}>
      {/* Left: icon + label */}
      <View style={styles.left}>
        {icon !== undefined && (
          <Ionicons
            name={icon}
            size={16}
            color={colors.iconSecondary}
            style={styles.icon}
          />
        )}
        <Text style={[textStyles.bodySmall, { color: colors.textTertiary }]}>
          {label}
        </Text>
      </View>

      {/* Right: value or badge */}
      <View style={styles.right}>
        {valueBadge !== undefined && badgeColors !== null ? (
          <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
            <Text style={[textStyles.labelMedium, { color: badgeColors.text }]}>
              {value}
            </Text>
          </View>
        ) : (
          <Text
            style={[textStyles.bodySmall, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
        {onPress !== undefined && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.iconSecondary}
            style={styles.chevron}
          />
        )}
      </View>
    </View>
  );

  return (
    <>
      {onPress !== undefined ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}`}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      ) : (
        <View style={styles.touchable}>{content}</View>
      )}
      {showDivider && (
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  touchable: {
    minHeight: 44,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[4],
    flexShrink: 0,
  },
  icon: {
    marginRight: spacing[2],
  },
  chevron: {
    marginLeft: spacing[1],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  divider: {
    height: borderWidth.hairline,
    marginLeft: spacing[2],
  },
});
