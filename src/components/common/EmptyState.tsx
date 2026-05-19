/**
 * EmptyState — Warm, Guiding Empty State
 * feature/ui-polish-global ✅
 *
 * Enhancements:
 *   - Icon container is larger and uses a subtle gradient
 *   - Description text is warmer and more human
 *   - Spring entrance — feels inviting not stark
 *   - CTA button is prominently placed with spacing
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { CustomButton } from './CustomButton';
import { spacing, radius, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps): React.JSX.Element {
  const { colors } = useTheme();

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(compact ? 10 : 20)).current;
  const scale      = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, delay: 100, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      Animated.spring(scale,      { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, [opacity, translateY, scale]);

  const iconSize          = compact ? 36 : 48;
  const iconContainerSize = compact ? 80 : 104;

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compact,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {/* Icon container */}
      <View
        style={[
          styles.iconContainer,
          {
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: iconContainerSize / 2,
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={colors.textTertiary} />
      </View>

      {/* Title */}
      <Text
        style={[
          compact ? textStyles.headingSmall : textStyles.headingMedium,
          { color: colors.textPrimary, marginTop: compact ? spacing[3] : spacing[5] },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description !== undefined && (
        <Text
          style={[
            textStyles.bodySmall,
            {
              color: colors.textTertiary,
              marginTop: spacing[2],
              textAlign: 'center',
              maxWidth: 260,
              lineHeight: 20,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {/* CTA */}
      {action !== undefined && (
        <View style={styles.actionContainer}>
          <CustomButton
            label={action.label}
            onPress={action.onPress}
            variant={action.variant ?? 'primary'}
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontal,
    paddingVertical: spacing[12],
  },
  compact: {
    paddingVertical: spacing[8],
    flex: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionContainer: { marginTop: spacing[6] },
});
