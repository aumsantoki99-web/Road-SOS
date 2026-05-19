/**
 * ActionCard — Quick action grid tile
 *
 * Used in the Home screen quick action grid.
 * 2×2 grid: Start Ride | Emergency Contacts | Nearby Hospitals | Offline Mode
 *
 * Design:
 *   - Icon in a gradient-tinted pill container
 *   - Title bold, description muted below
 *   - Subtle top-left accent stripe (brand touch)
 *   - Spring press scale with card lift on press
 *   - Optional badge (e.g. contact count, unsynced items)
 *
 * Usage:
 *   <ActionCard
 *     icon="speedometer"
 *     iconColor={colors.safe}
 *     title="Start Ride"
 *     description="Begin safety monitoring"
 *     onPress={handleStart}
 *   />
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon and accent color — pass a color token */
  iconColor: string;
  title: string;
  description?: string;
  onPress: () => void;
  /** Optional badge count (e.g. number of contacts) */
  badge?: number;
  disabled?: boolean;
  accessibilityHint?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActionCard({
  icon,
  iconColor,
  title,
  description,
  onPress,
  badge,
  disabled = false,
  accessibilityHint,
}: ActionCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const elevation = useRef(new Animated.Value(1)).current;

  function handlePressIn(): void {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }),
      Animated.timing(elevation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }

  function handlePressOut(): void {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.timing(elevation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  // Icon container background — very subtle tint of the icon color
  const iconBgColor = `${iconColor}1A`; // 10% opacity

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: elevation }]}>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.surfaceBorder,
            opacity: disabled ? 0.5 : 1,
          },
          shadows.card,
        ]}
      >
        {/* Top accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: iconColor }]} />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={layout.iconMd} color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text
            style={[textStyles.headingSmall, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description !== undefined && (
            <Text
              style={[
                textStyles.caption,
                { color: colors.textTertiary, marginTop: spacing[0.5] },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[textStyles.caption, { color: colors.black, fontWeight: '700' }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    paddingTop: spacing[5],
    overflow: 'hidden',
    minHeight: 130,
    position: 'relative',
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 3,
    borderBottomRightRadius: radius.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  textBlock: {
    flex: 1,
  },
  badge: {
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
});
