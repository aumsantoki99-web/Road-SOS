/**
 * CustomButton — Primary interactive element
 *
 * Variants:
 *   primary   → amber gradient fill — main CTAs
 *   secondary → outlined, accent border — supporting actions
 *   ghost     → text only, no border — subtle actions
 *   danger    → crimson fill — destructive / emergency actions
 *
 * Features:
 *   - Spring press animation (scale down on press, bounce back)
 *   - Loading spinner state (replaces label, disables interaction)
 *   - Icon support (left or right of label)
 *   - Full-width or hug-content sizing
 *   - Disabled state with visual feedback
 *
 * Usage:
 *   <CustomButton label="Start Ride" variant="primary" onPress={handleStart} />
 *   <CustomButton label="Delete" variant="danger" onPress={handleDelete} loading />
 */

import React, { useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, layout, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { gradients } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface CustomButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  accessibilityHint?: string;
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<ButtonSize, { height: number; paddingHorizontal: number; iconSize: number }> = {
  sm: { height: layout.minTouchTarget, paddingHorizontal: spacing[4], iconSize: 16 },
  md: { height: 50,  paddingHorizontal: spacing[6], iconSize: 18 },
  lg: { height: 58,  paddingHorizontal: spacing[8], iconSize: 20 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  accessibilityHint,
}: CustomButtonProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const isInteractable = !loading && !disabled;
  const sizeConfig = SIZE_CONFIG[size];

  function handlePressIn(): void {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  }

  function handlePressOut(): void {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }

  // ── Resolve colors by variant ────────────────────────────────────────────

  function getLabelColor(): string {
    if (disabled) return colors.textDisabled;
    switch (variant) {
      case 'primary': return colors.black;
      case 'danger':  return colors.white;
      case 'secondary':
      case 'ghost':   return colors.accent;
    }
  }

  function getIconColor(): string {
    return getLabelColor();
  }

  // ── Inner content ─────────────────────────────────────────────────────────

  function renderContent(): React.JSX.Element {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.black : colors.accent}
        />
      );
    }
    return (
      <View style={styles.contentRow}>
        {iconLeft !== undefined && (
          <Ionicons
            name={iconLeft}
            size={sizeConfig.iconSize}
            color={getIconColor()}
            style={styles.iconLeft}
          />
        )}
        <Text style={[textStyles.labelLarge, { color: getLabelColor(), textAlign: 'center' }]}>
          {label}
        </Text>
        {iconRight !== undefined && (
          <Ionicons
            name={iconRight}
            size={sizeConfig.iconSize}
            color={getIconColor()}
            style={styles.iconRight}
          />
        )}
      </View>
    );
  }

  // ── Wrapper styles by variant ─────────────────────────────────────────────

  const containerStyle = [
    styles.base,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
      opacity: disabled ? 0.45 : 1,
      borderRadius: radius.lg,
    },
  ];

  // ── Render: primary / danger use gradient fill ────────────────────────────

  if ((variant === 'primary' || variant === 'danger') && !disabled) {
    const gradientColors =
      variant === 'primary' ? gradients.amber.colors : gradients.emergency.colors;

    const glowShadow =
      variant === 'primary' ? shadows.glowAmber : shadows.glowEmergency;

    return (
      <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
        <TouchableOpacity
          onPress={isInteractable ? onPress : undefined}
          onPressIn={isInteractable ? handlePressIn : undefined}
          onPressOut={isInteractable ? handlePressOut : undefined}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: !isInteractable, busy: loading }}
          style={[containerStyle, glowShadow]}
        >
          <LinearGradient
            colors={gradientColors}
            start={gradients.amber.start}
            end={gradients.amber.end}
            style={StyleSheet.absoluteFill}
          />
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Render: secondary / ghost / disabled ──────────────────────────────────

  const flatBgColor =
    disabled
      ? colors.surfaceSecondary
      : variant === 'secondary'
      ? colors.transparent
      : colors.transparent;

  const flatBorderColor =
    disabled
      ? colors.surfaceBorder
      : variant === 'secondary'
      ? colors.accent
      : colors.transparent;

  const flatBorderWidth =
    variant === 'ghost' ? 0 : borderWidth.medium;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
      <TouchableOpacity
        onPress={isInteractable ? onPress : undefined}
        onPressIn={isInteractable ? handlePressIn : undefined}
        onPressOut={isInteractable ? handlePressOut : undefined}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !isInteractable, busy: loading }}
        style={[
          containerStyle,
          {
            backgroundColor: flatBgColor,
            borderWidth: flatBorderWidth,
            borderColor: flatBorderColor,
          },
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minWidth: layout.minTouchTarget,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});
