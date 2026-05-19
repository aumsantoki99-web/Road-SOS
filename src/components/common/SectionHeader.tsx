/**
 * SectionHeader — Section divider with label and optional action
 *
 * Used to group related content blocks on a screen.
 * The label uses CAPS styling — clear visual hierarchy without
 * needing a bold weight that competes with card content.
 *
 * Usage:
 *   <SectionHeader title="Quick Actions" />
 *   <SectionHeader title="Recent Rides" action={{ label: 'See all', onPress: () => nav.navigate('RideHistory') }} />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionAction {
  label: string;
  onPress: () => void;
}

export interface SectionHeaderProps {
  title: string;
  action?: SectionAction;
  /** Extra top margin — default spacing applied automatically */
  topSpacing?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
  topSpacing = spacing[6],
}: SectionHeaderProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { marginTop: topSpacing }]}>
      {/* Left — section label */}
      <Text style={[textStyles.labelCaps, { color: colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>

      {/* Right — optional action */}
      {action !== undefined && (
        <TouchableOpacity
          onPress={action.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={[textStyles.labelMedium, { color: colors.accent }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
});
