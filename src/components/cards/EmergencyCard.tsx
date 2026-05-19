/**
 * EmergencyCard — High-urgency alert card
 *
 * Used for: crash detected alerts, SOS sent confirmations,
 * critical system warnings that need immediate attention.
 *
 * Visual language:
 *   - Crimson border with subtle glow (danger reserved)
 *   - Pulsing outer ring when `pulsing` prop is true
 *   - Icon in emergency-tinted container
 *   - Optional dismiss button (top-right ×)
 *   - Optional action button at the bottom
 *
 * Usage:
 *   <EmergencyCard
 *     title="Crash Detected"
 *     description="Sending alert to your emergency contacts in 30 seconds."
 *     icon="warning"
 *     pulsing
 *     action={{ label: 'Cancel Alert', onPress: handleCancel }}
 *     onDismiss={handleDismiss}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { CustomButton } from '../common/CustomButton';
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardAction {
  label: string;
  onPress: () => void;
}

export interface EmergencyCardProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  pulsing?: boolean;
  action?: CardAction;
  onDismiss?: () => void;
  timestamp?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmergencyCard({
  title,
  description,
  icon = 'warning',
  pulsing = false,
  action,
  onDismiss,
  timestamp,
}: EmergencyCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!pulsing) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulsing, pulseScale, pulseOpacity]);

  return (
    <View style={styles.wrapper}>
      {/* Outer pulsing ring */}
      {pulsing && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: colors.emergency,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}

      {/* Card body */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.emergencySubtle,
            borderColor: colors.emergencyBorder,
          },
          shadows.glowEmergency,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.emergencyMuted }]}>
            <Ionicons name={icon} size={layout.iconMd} color={colors.emergency} />
          </View>

          {/* Title + timestamp */}
          <View style={styles.titleBlock}>
            <Text style={[textStyles.headingSmall, { color: colors.emergency }]}>
              {title}
            </Text>
            {timestamp !== undefined && (
              <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                {timestamp}
              </Text>
            )}
          </View>

          {/* Dismiss */}
          {onDismiss !== undefined && (
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.dismissBtn, { backgroundColor: colors.emergencyMuted }]}
              accessibilityLabel="Dismiss alert"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.emergencyText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {description !== undefined && (
          <Text
            style={[
              textStyles.bodySmall,
              { color: colors.emergencyText, marginTop: spacing[3], lineHeight: 20 },
            ]}
          >
            {description}
          </Text>
        )}

        {/* Action button */}
        {action !== undefined && (
          <View style={styles.actionContainer}>
            <CustomButton
              label={action.label}
              onPress={action.onPress}
              variant="danger"
              size="sm"
              fullWidth
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: borderWidth.medium,
    padding: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
    flexShrink: 0,
  },
  actionContainer: {
    marginTop: spacing[4],
  },
});
