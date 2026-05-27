/**
 * FloatingSOSButton — Circular premium SOS button
 * feature/accessibility ✅ — screen reader, role, live region
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '../../theme/spacing';

export interface FloatingSOSButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'default' | 'hero';
}

export function FloatingSOSButton({
  onPress,
  disabled = false,
  size = 'default',
}: FloatingSOSButtonProps): React.JSX.Element {
  const buttonSize = size === 'hero' ? 146 : 116;
  const outerSize = size === 'hero' ? 184 : 156;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonLift = useRef(new Animated.Value(0)).current;

  function handlePressIn(): void {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.955,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.timing(buttonLift, {
        toValue: 2,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePressOut(): void {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.timing(buttonLift, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePress(): void {
    // Announce to screen reader
    AccessibilityInfo.announceForAccessibility(
      'SOS confirmation screen opening. You have 10 seconds to cancel.',
    );
    onPress();
  }

  return (
    <View
      style={[styles.container, { width: outerSize, height: outerSize, minWidth: outerSize, minHeight: outerSize }]}
      testID={`sos-button-${size}`}
      accessible
      accessibilityRole="button"
      accessibilityLabel="SOS Emergency Button"
      accessibilityHint="Opens emergency alert confirmation. Alert sends automatically after 10 seconds."
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.outerShell,
          {
            width: buttonSize,
            height: buttonSize,
          },
          {
            transform: [{ scale: buttonScale }, { translateY: buttonLift }],
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <TouchableOpacity
          onPress={disabled ? undefined : handlePress}
          onPressIn={disabled ? undefined : handlePressIn}
          onPressOut={disabled ? undefined : handlePressOut}
          activeOpacity={1}
          disabled={disabled}
          style={styles.touchLayer}
          hitSlop={8}
        >
          <View style={[styles.innerPlate, { width: buttonSize - 10, height: buttonSize - 10 }]}>
            <LinearGradient
              colors={['#FF6A6A', '#EF4444', '#DC2626', '#991B1B']}
              style={styles.core}
              start={{ x: 0.25, y: 0 }}
              end={{ x: 0.75, y: 1 }}
            >
              <Text style={[styles.sosLabel, size === 'hero' && styles.sosLabelHero]}>SOS</Text>
            </LinearGradient>
          </View>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[styles.highlight, { height: buttonSize * 0.42 }]}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 156,
    minHeight: 156,
  },
  outerShell: {
    width: 116,
    height: 116,
    borderRadius: radius.full,
    backgroundColor: '#F5F6F7',
    borderWidth: 2,
    borderColor: '#D4D4D8',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 12,
  },
  touchLayer: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerPlate: {
    width: 106,
    height: 106,
    borderRadius: radius.full,
    backgroundColor: '#FFE6E6',
    padding: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -3, height: -8 },
    shadowOpacity: 0.72,
    shadowRadius: 8,
  },
  core: {
    flex: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7A1111',
    shadowColor: '#4C0519',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 7,
    elevation: 6,
  },
  highlight: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 48,
    borderRadius: radius.full,
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sosLabelHero: {
    fontSize: 40,
  },
});
