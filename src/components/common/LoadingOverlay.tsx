/**
 * LoadingOverlay — Premium Branded Loading State
 * feature/ui-polish-global ✅
 *
 * Enhancements:
 *   - Three concentric rings with staggered pulse — more organic
 *   - Amber ring color stays on-brand
 *   - Modal version has frosted-glass feel via gradient overlay
 *   - Message text fades in after ring appears
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { spacing, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  mode?: 'full' | 'inline';
}

const RING_SIZE  = 60;
const RING_SIZE2 = 80;
const RING_SIZE3 = 100;

function PulseRing({
  size,
  delay,
  color,
}: {
  size: number;
  delay: number;
  color: string;
}): React.JSX.Element {
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.2, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.8, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

function Spinner(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.spinnerWrap}>
      <PulseRing size={RING_SIZE3} delay={300} color={colors.accent} />
      <PulseRing size={RING_SIZE2} delay={150} color={colors.accent} />
      <PulseRing size={RING_SIZE}  delay={0}   color={colors.accent} />
      <View style={[styles.coreDot, { backgroundColor: colors.accent }]} />
    </View>
  );
}

export function LoadingOverlay({
  visible,
  message,
  mode = 'full',
}: LoadingOverlayProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const msgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(msgOpacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
  }, [visible, msgOpacity]);

  if (!visible) return null;

  const content = (
    <View style={styles.content}>
      <Spinner />
      {message !== undefined && (
        <Animated.Text
          style={[
            textStyles.bodySmall,
            { color: colors.textSecondary, marginTop: spacing[5], textAlign: 'center', opacity: msgOpacity },
          ]}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );

  if (mode === 'inline') {
    return <View style={styles.inlineContainer}>{content}</View>;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.bgElevated }]}>
          {content}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderRadius: radius.xl,
    padding: spacing[8],
    alignItems: 'center',
    minWidth: 160,
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  content:     { alignItems: 'center' },
  spinnerWrap: {
    width: RING_SIZE3,
    height: RING_SIZE3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  coreDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
});
