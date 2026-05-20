/**
 * OnboardingOverlay — First Launch Welcome Experience
 *
 * Shown once when user has 0 contacts and 0 rides.
 * Warm, reassuring — not a tutorial, a welcome.
 * 3 steps with dot indicator, slide animation, dismiss button.
 * Completion stored in AsyncStorage via StorageService.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../storage/StorageService';
import { STORAGE_KEYS } from '../../constants';
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    icon:        'people' as const,
    iconColor:   '#F59E0B',
    title:       'Add an emergency contact',
    description: 'Tell RideSafe who to call if something happens. One person is enough to get started.',
  },
  {
    icon:        'speedometer' as const,
    iconColor:   '#14B8A6',
    title:       'Start your first ride',
    description: 'Tap "Start Ride" before you head out. RideSafe silently watches over you the whole way.',
  },
  {
    icon:        'shield-checkmark' as const,
    iconColor:   '#14B8A6',
    title:       "You're protected",
    description: "If anything goes wrong, RideSafe alerts your contacts automatically. Ride with confidence.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export function OnboardingOverlay({
  visible,
  onDismiss,
}: OnboardingOverlayProps): React.JSX.Element {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);

  const slideAnim  = useRef(new Animated.Value(0)).current;
  const sheetAnim  = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Sheet entrance
  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(sheetAnim,   { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, [visible, overlayAnim, sheetAnim]);

  function goToStep(nextStep: number): void {
    // Slide out current
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      // Reset and slide in
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    });
  }

  async function handleDismiss(): Promise<void> {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(sheetAnim,   { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());

    await StorageService.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
  }

  function handleNext(): void {
    if (step < STEPS.length - 1) {
      goToStep(step + 1);
    } else {
      void handleDismiss();
    }
  }

  const current = STEPS[step];
  if (!current) return <></>;

  const isLast = step === STEPS.length - 1;

  return (
    <Modal transparent visible={visible} statusBarTranslucent animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: overlayAnim, backgroundColor: colors.overlay }]}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.bgSecondary,
            transform: [{ translateY: sheetAnim }],
          },
          shadows.float,
        ]}
      >
        {/* Gradient top strip */}
        <LinearGradient
          colors={[`${current.iconColor}18`, 'transparent']}
          style={styles.sheetGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />

        {/* Step content */}
        <Animated.View
          style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: `${current.iconColor}18` }]}>
            <Ionicons name={current.icon} size={44} color={current.iconColor} />
          </View>

          {/* Text */}
          <Text style={[textStyles.displaySmall, { color: colors.textPrimary, marginTop: spacing[6], textAlign: 'center' }]}>
            {current.title}
          </Text>
          <Text style={[textStyles.bodyMedium, { color: colors.textTertiary, marginTop: spacing[3], textAlign: 'center', lineHeight: 24 }]}>
            {current.description}
          </Text>
        </Animated.View>

        {/* Dot indicator */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => i < step && goToStep(i)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? current.iconColor : colors.surfaceBorder,
                    width: i === step ? 20 : 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Skip */}
          {!isLast && (
            <TouchableOpacity
              onPress={() => void handleDismiss()}
              style={styles.skipBtn}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={[textStyles.labelMedium, { color: colors.textTertiary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          )}

          {/* Next / Get Started */}
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextBtn,
              { backgroundColor: current.iconColor },
              shadows.glowAmber,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Next step'}
          >
            <Text style={[textStyles.labelLarge, { color: '#FFFFFF' }]}>
              {isLast ? "Let's go  🚀" : 'Next'}
            </Text>
            {!isLast && (
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: spacing[2] }} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: layout.screenHorizontal,
    paddingBottom: spacing[10],
    paddingTop: spacing[3],
    overflow: 'hidden',
    minHeight: 420,
  },
  sheetGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[6],
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minHeight: 44,
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.xl,
    minHeight: 52,
    flex: 1,
    justifyContent: 'center',
    marginLeft: spacing[3],
  },
});
