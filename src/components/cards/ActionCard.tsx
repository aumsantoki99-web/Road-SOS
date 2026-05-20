/**
 * ActionCard — Premium Quick Action Tile
 * feature/ui-polish-global ✅
 *
 * Redesigned to match the polished HomeScreen ActionTile aesthetic.
 * Used in: HomeScreen quick actions grid, any dashboard grid layout.
 *
 * Features:
 *   - Full-width accent line at top (color-coded per action)
 *   - Icon in a tinted container
 *   - Spring press animation with scale + subtle shadow lift
 *   - Badge count for contacts, alerts etc.
 *   - Disabled state with reduced opacity
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
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description?: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
  accessibilityHint?: string;
  /** Makes the card horizontal layout — for hero/wide cards */
  hero?: boolean;
}

export function ActionCard({
  icon,
  iconColor,
  title,
  description,
  onPress,
  badge,
  disabled = false,
  accessibilityHint,
  hero = false,
}: ActionCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale   = useRef(new Animated.Value(1)).current;
  const shadowO = useRef(new Animated.Value(1)).current;

  function handlePressIn(): void {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 0.95, useNativeDriver: true,  speed: 60, bounciness: 0 }),
      Animated.timing(shadowO, { toValue: 0.4,  useNativeDriver: false, duration: 100 }),
    ]).start();
  }

  function handlePressOut(): void {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true,  speed: 20, bounciness: 10 }),
      Animated.timing(shadowO, { toValue: 1, useNativeDriver: false, duration: 200 }),
    ]).start();
  }

  const iconBg = `${iconColor}18`;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, hero && styles.heroWrap]}>
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
          hero && styles.cardHero,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.surfaceBorder,
            opacity: disabled ? 0.45 : 1,
          },
          shadows.card,
        ]}
      >
        {/* Top accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: iconColor }]} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: iconBg }, hero && styles.iconWrapHero]}>
          <Ionicons name={icon} size={hero ? 26 : 22} color={iconColor} />
        </View>

        {/* Text */}
        <View style={[styles.textBlock, hero && styles.textBlockHero]}>
          <Text
            style={[
              hero ? textStyles.headingSmall : textStyles.labelLarge,
              { color: colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description !== undefined && (
            <Text
              style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}
              numberOfLines={hero ? 1 : 2}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[textStyles.caption, { color: colors.black, fontWeight: '800' }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { alignSelf: 'stretch' },
  card: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
    paddingTop: spacing[5],
    overflow: 'hidden',
    position: 'relative',
    minHeight: 110,
  },
  cardHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    minHeight: 80,
    paddingTop: spacing[4],
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    flexShrink: 0,
  },
  iconWrapHero: { marginBottom: 0 },
  textBlock:     {},
  textBlockHero: { flex: 1 },
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
