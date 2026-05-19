/**
 * ContactCard — Polished Emergency Contact Item
 * feature/ui-polish-contacts ✅
 *
 * Enhancements:
 *   - Larger avatar (52px) with bolder initial
 *   - Primary badge moved to subtitle line — less visual clutter in namerow
 *   - Delete button uses a cleaner icon-only round button
 *   - Press animation on the whole card
 *   - Phone number formatted and shown prominently
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
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { formatPhoneNumber } from '../../utils';
import type { EmergencyContact } from '../../types';

const AVATAR_COLORS = [
  '#7C3AED', '#0D9488', '#DC2626', '#D97706',
  '#2563EB', '#059669', '#9333EA', '#DB2777',
];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length] ?? '#7C3AED';
}

export interface ContactCardProps {
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const avatarColor = getAvatarColor(contact.name);
  const initial     = contact.name.charAt(0).toUpperCase();

  function handlePressIn(): void {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  }
  function handlePressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onEdit}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${contact.name}`}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: contact.isPrimary ? colors.accentMuted : colors.surfaceBorder,
            borderLeftColor: contact.isPrimary ? colors.accent : colors.surfaceBorder,
          },
          shadows.card,
        ]}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={[textStyles.headingMedium, { color: '#FFFFFF', fontSize: 20 }]}>
            {initial}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[textStyles.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
            numberOfLines={1}
          >
            {contact.name}
          </Text>
          <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatPhoneNumber(contact.phone)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
              {contact.relationship}
            </Text>
            {contact.isPrimary && (
              <>
                <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
                <Ionicons name="star" size={10} color={colors.accent} />
                <Text style={[textStyles.caption, { color: colors.accent, marginLeft: 2 }]}>
                  Primary
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.deleteBtn, { backgroundColor: colors.emergencySubtle }]}
          accessibilityLabel={`Delete ${contact.name}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color={colors.emergency} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    borderLeftWidth: 3,
    padding: spacing[4],
    gap: spacing[3],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info:    { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: 3 },
  metaDot: { width: 3, height: 3, borderRadius: radius.full },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
