/**
 * SOSConfirmationScreen — Premium Emergency Overlay
 * feature/ui-polish-home ✅
 *
 * Presented as transparentModal — background stays visible.
 * Redesigned for emotional clarity under stress:
 *   - Large, unmistakeable countdown ring
 *   - Contacts shown with avatars — feel personal not abstract
 *   - Cancel button is prominent and reassuring, not hidden
 *   - Gradient emergency header creates immediate urgency recognition
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useSOSCountdown } from '../../hooks/useSOSCountdown';
import { spacing, radius, layout, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { mockContacts } from '../../mock';
import type { RootScreenNavigationProp } from '../../navigation/types';

const SOS_SECONDS = 10;

type Props = { navigation: RootScreenNavigationProp<'SOSConfirmation'> };

export function SOSConfirmationScreen(_props: Props): React.JSX.Element {
  const { colors } = useTheme();
  const nav = useAppNavigation();

  const handleComplete = useCallback((): void => {
    console.warn('[SOS] Alert triggered — connect EmergencyService here');
    nav.goBack();
  }, [nav]);

  const handleCancel = useCallback((): void => nav.goBack(), [nav]);

  const { count, cancel, progress } = useSOSCountdown({
    seconds: SOS_SECONDS,
    onComplete: handleComplete,
    onCancel: handleCancel,
  });

  const AVATAR_COLORS = ['#7C3AED','#0D9488','#DC2626','#D97706','#2563EB','#059669'];

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.sheet, { backgroundColor: colors.bgSecondary, borderColor: colors.emergencyBorder }, shadows.float]}>

        {/* ── Emergency header ───────────────────────────────────────── */}
        <LinearGradient
          colors={[colors.emergencySubtle, 'transparent']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <View style={[styles.warningIcon, { backgroundColor: colors.emergency }]}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.headingLarge, { color: colors.emergency }]}>SOS Alert</Text>
            <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              Sending emergency alert to your contacts
            </Text>
          </View>
        </View>

        {/* ── Countdown ring ─────────────────────────────────────────── */}
        <View style={styles.countdownWrap}>
          {/* Background ring */}
          <View style={[styles.ringBg, { borderColor: colors.surfaceBorder }]} />
          {/* Filled ring — fades with progress */}
          <Animated.View style={[styles.ringFill, { borderColor: colors.emergency, opacity: progress }]} />
          {/* Centre */}
          <View style={[styles.ringInner, { overflow: 'hidden' }]}>
            <LinearGradient
              colors={[colors.emergency, '#B91C1C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            />
            <Text style={styles.countNumber}>{count}</Text>
            <Text style={styles.countLabel}>SEC</Text>
          </View>
        </View>

        {/* ── Contacts being alerted ─────────────────────────────────── */}
        <View style={[styles.contactsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
          <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
            ALERTING
          </Text>
          {mockContacts.length === 0 ? (
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary }]}>
              No contacts added yet.
            </Text>
          ) : (
            <View style={styles.contactList}>
              {mockContacts.map((contact) => {
                const avatarColor = AVATAR_COLORS[(contact.name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length] ?? '#7C3AED';
                const initial = contact.name.charAt(0).toUpperCase();
                return (
                  <View key={contact.id} style={styles.contactRow}>
                    <View style={[styles.contactAvatar, { backgroundColor: avatarColor }]}>
                      <Text style={[textStyles.labelMedium, { color: '#FFF' }]}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[textStyles.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {contact.name}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
                        {contact.relationship}
                      </Text>
                    </View>
                    {contact.isPrimary && (
                      <View style={[styles.primaryDot, { backgroundColor: colors.accentSubtle }]}>
                        <Ionicons name="star" size={10} color={colors.accent} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Location note ──────────────────────────────────────────── */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginLeft: spacing[1] }]}>
            Your location will be shared with contacts
          </Text>
        </View>

        {/* ── Cancel ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={cancel}
          style={[styles.cancelBtn, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }]}
          accessibilityLabel="Cancel SOS alert"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[textStyles.labelLarge, { color: colors.textPrimary, marginLeft: spacing[2] }]}>
            Cancel Alert
          </Text>
        </TouchableOpacity>

        <Text style={[textStyles.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[3] }]}>
          Alert sends automatically when timer reaches zero
        </Text>
      </View>
    </View>
  );
}

const RING_SIZE  = 136;
const INNER_SIZE = 104;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenHorizontal,
    paddingBottom: spacing[8],
  },
  sheet: {
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: borderWidth.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  ringBg: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
  },
  ringFill: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
  },
  ringInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: { color: '#FFF', fontSize: 46, fontWeight: '900', lineHeight: 50 },
  countLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  contactsBox: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  contactList: { gap: spacing[3] },
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  primaryDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[5] },

  cancelBtn: {
    alignSelf: 'stretch',
    height: layout.minTouchTarget + 10,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,
  },
});
