import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View, Animated, Easing, Vibration } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { AlertController } from '../../services/alertController';
import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../context/LocalizationContext';
import { useAppState } from '../../context/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CrashCountdown'>;

export function CrashCountdownScreen({ route, navigation }: Props): React.JSX.Element {
  const { event } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { state: appState } = useAppState();
  
  const INITIAL_SECONDS = appState.preferences.sosDelay;
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);
  const [handled, setHandled] = useState(false);

  const onExpire = useCallback(async () => {
    if (handled) return;
    setHandled(true);
    await AlertController.stopAlert();
    navigation.replace('DeadManSwitch', { event });
  }, [handled, event, navigation]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start looping audio and repeated haptic pulses
    void AlertController.startAlert();

    // Prevent going back via hardware back button (force resolution)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      backHandler.remove();
      void AlertController.stopAlert();
    };
  }, [pulseAnim]);

  // Countdown timer logic
  useEffect(() => {
    // Animate the visual progress ring shrinking
    Animated.timing(progressAnim, {
      toValue: (seconds - 1) / INITIAL_SECONDS,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!handled) {
            void onExpire();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, handled, progressAnim, INITIAL_SECONDS, onExpire]);

  const onImFine = async () => {
    if (handled) return;
    setHandled(true);
    await AlertController.stopAlert();
    Vibration.cancel();
    console.log('[CrashCountdown] False positive resolved by user:', event);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={['rgba(211,47,47,0.15)', 'transparent']}
        style={styles.headerGradient}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }], borderColor: colors.emergency }]} />
          <View style={[styles.warningBadge, { backgroundColor: colors.emergency }]}>
            <Ionicons name="warning" size={32} color={colors.white} />
          </View>
        </View>

        <Text style={[textStyles.displayMedium, styles.heading, { color: colors.textPrimary }]}>
          {t('crash.impactDetected')}
        </Text>
        <Text style={[textStyles.bodyLarge, styles.subheading, { color: colors.textSecondary }]}>
          {t('crash.areYouOkay')}
        </Text>

        {/* Custom Premium Countdown Progress Ring */}
        <View style={styles.countdownContainer}>
          <View style={[styles.ringTrack, { borderColor: colors.surfaceBorder }]} />
          <Animated.View style={[styles.ringProgress, { borderColor: colors.emergency, opacity: progressAnim }]} />
          <View style={[styles.ringInner, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.counterText, { color: colors.textPrimary }]}>{seconds}</Text>
            <Text style={[styles.secLabel, { color: colors.textTertiary }]}>{t('crash.seconds')}</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.safe, opacity: pressed ? 0.9 : 1.0 }
            ]}
            onPress={onImFine}
            accessibilityRole="button"
            accessibilityLabel="I'm okay, cancel SOS"
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.white} style={{ marginRight: spacing[2] }} />
            <Text style={styles.cancelBtnText}>{t('crash.imOkay')}</Text>
          </Pressable>
          <Text style={[styles.infoNote, { color: colors.textTertiary }]}>
            {t('crash.autoAlert')}
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
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heading: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subheading: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
    marginBottom: spacing[6],
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
    backgroundColor: '#121218',
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
    color: '#FFFFFF',
    lineHeight: 70,
  },
  secLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
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
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoNote: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
  },
});
