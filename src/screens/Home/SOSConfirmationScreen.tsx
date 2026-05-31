/**
 * SOSConfirmationScreen — Premium Emergency Overlay
 * Redesigned to match DeadManSwitch (trip) UI but for manual SOS.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useTheme } from '../../context/ThemeContext';
import { useAppState } from '../../context/AppStateContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useSOSCountdown } from '../../hooks/useSOSCountdown';
import { useRideSession } from '../../hooks/useRideSession';
import { spacing, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import type { RootScreenNavigationProp } from '../../navigation/types';
import { NotificationService, SosService } from '../../services';
import { AlertController } from '../../services/alertController';

type Props = { navigation: RootScreenNavigationProp<'SOSConfirmation'> };

export function SOSConfirmationScreen(_props: Props): React.JSX.Element {
  const { colors } = useTheme();
  const { state: appState } = useAppState();
  const nav = useAppNavigation();
  const hasSentRef = useRef(false);
  const rideSession = useRideSession();

  // Handle automatic dispatch
  const handleComplete = useCallback((): void => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    
    void AlertController.stopAlert();

    void (async () => {
      let lat: number | null = null;
      let lon: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        }
      } catch (locErr) {
        console.warn('[SOS] Could not get location for SMS:', locErr);
      }

      const manualEvent = {
        timestamp: Date.now(),
        severity: 'severe' as const,
        latitude: lat ?? 22.3039,
        longitude: lon ?? 70.8022,
        gForce: 0,
        gyroRadS: 0,
        speedBeforeKmh: 0,
        speedAfterKmh: 0,
      };

      try {
        const result = await SosService.triggerSOS(manualEvent, 'manual_sos_button');
        await NotificationService.notifySOSSent(result.contactsReached);

        rideSession.startRide();

        nav.replace('SosTriggered', { event: manualEvent as any, sosMessage: result.message });
      } catch (error) {
        console.warn('[SOS] Failed to trigger manual alert:', error);
        nav.replace('SosTriggered', { event: manualEvent as any, sosMessage: 'Could not send emergency alert.' });
      }
    })();
  }, [nav, rideSession]);

  const handleCancel = useCallback((): void => {
    void AlertController.stopAlert();
    nav.goBack();
  }, [nav]);

  const { count, cancel, progress } = useSOSCountdown({
    seconds: appState.preferences.sosDelay,
    onComplete: handleComplete,
    onCancel: handleCancel,
  });

  // Pulse animation for the glowing ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start siren and haptics
    void AlertController.startAlert();
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => {
      void AlertController.stopAlert();
    };
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={['rgba(220, 38, 38, 0.15)', 'transparent']}
        style={styles.headerGradient}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }], borderColor: colors.emergency }]} />
          <View style={[styles.warningBadge, { backgroundColor: colors.emergency }]}>
            <Ionicons name="warning" size={36} color={colors.white} />
          </View>
        </View>

        <Text style={[textStyles.displayMedium, styles.heading, { color: colors.textPrimary }]}>
          Manual SOS
        </Text>
        
        <Text style={[textStyles.bodyLarge, styles.subheading, { color: colors.textSecondary }]}>
          An emergency SOS dispatch will launch automatically in:
        </Text>

        {/* Custom Premium Countdown Progress Ring */}
        <View style={styles.countdownContainer}>
          <View style={[styles.ringTrack, { borderColor: colors.surfaceBorder }]} />
          <Animated.View style={[styles.ringProgress, { borderColor: colors.emergency, opacity: progress }]} />
          <View style={[styles.ringInner, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.counterText, { color: colors.textPrimary }]}>{count}</Text>
            <Text style={[styles.secLabel, { color: colors.textTertiary }]}>SECONDS</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder, opacity: pressed ? 0.9 : 1.0 }
            ]}
            onPress={cancel}
          >
            <Ionicons name="close-circle" size={26} color={colors.emergency} style={{ marginRight: spacing[2] }} />
            <Text style={[styles.cancelBtnText, { color: colors.emergency }]}>CANCEL SOS</Text>
          </Pressable>
          
          <Text style={[styles.infoNote, { color: colors.textTertiary }]}>
            Emergency contacts will be texted and emergency services will be called automatically if not cancelled.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    opacity: 0.4,
  },
  warningBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heading: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  subheading: {
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  countdownContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: spacing[4],
  },
  ringTrack: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
  },
  ringProgress: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
  },
  ringInner: {
    width: 154,
    height: 154,
    borderRadius: 77,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  counterText: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
  },
  secLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[4],
  },
  cancelBtn: {
    width: '100%',
    height: 64,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoNote: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16,
  },
});
