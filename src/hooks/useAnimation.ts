/**
 * useAnimation — Reusable animation primitives
 * feature/animations ✅
 *
 * Centralises common animation patterns so components
 * are not each reinventing spring/fade/slide logic.
 *
 * Each hook is exported individually — import what you need:
 *   import { useFadeIn, useSpringScale, usePulse } from '@hooks';
 */

import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

// ─── Fade in ──────────────────────────────────────────────────────────────────

export function useFadeIn(duration = 300, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  const start = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  const reset = useCallback(() => opacity.setValue(0), [opacity]);

  return { opacity, start, reset };
}

// ─── Slide up + fade in ───────────────────────────────────────────────────────

export function useSlideUp(fromY = 24, duration = 350, delay = 0) {
  const translateY = useRef(new Animated.Value(fromY)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  const start = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, duration, delay]);

  const reset = useCallback(() => {
    translateY.setValue(fromY);
    opacity.setValue(0);
  }, [translateY, opacity, fromY]);

  return { translateY, opacity, start, reset };
}

// ─── Spring scale (press feedback) ───────────────────────────────────────────

export function useSpringScale(
  config: { speed?: number; bounciness?: number } = {},
) {
  const { speed = 20, bounciness = 10 } = config;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed,
      bounciness,
    }).start();
  }, [scale, speed, bounciness]);

  const pop = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }, [scale]);

  return { scale, pressIn, pressOut, pop };
}

// ─── Pulse loop ───────────────────────────────────────────────────────────────

export function usePulse(minValue = 0.4, maxValue = 1.0, duration = 900) {
  const value   = useRef(new Animated.Value(maxValue)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const start = useCallback(() => {
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: minValue, duration, useNativeDriver: true }),
        Animated.timing(value, { toValue: maxValue, duration, useNativeDriver: true }),
      ]),
    );
    animRef.current.start();
  }, [value, minValue, maxValue, duration]);

  const stop = useCallback(() => {
    animRef.current?.stop();
    value.setValue(maxValue);
  }, [value, maxValue]);

  return { value, start, stop };
}

// ─── Shimmer (loading skeleton) ───────────────────────────────────────────────

export function useShimmer(duration = 1000) {
  const shimmer = useRef(new Animated.Value(0)).current;

  const start = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer, duration]);

  const opacity = shimmer.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return { shimmer, opacity, start };
}

// ─── Stagger children ─────────────────────────────────────────────────────────

/**
 * Stagger-animate a list of items into view.
 *
 * Usage:
 *   const { opacities, startStagger } = useStagger(contacts.length);
 *   useEffect(() => { startStagger(); }, []);
 *   contacts.map((c, i) => (
 *     <Animated.View key={c.id} style={{ opacity: opacities[i] }}>
 *       <ContactCard ... />
 *     </Animated.View>
 *   ));
 */
export function useStagger(count: number, staggerMs = 60, duration = 300) {
  const opacities = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;

  const startStagger = useCallback(() => {
    Animated.stagger(
      staggerMs,
      opacities.map((opacity) =>
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [opacities, staggerMs, duration]);

  const resetStagger = useCallback(() => {
    opacities.forEach((o) => o.setValue(0));
  }, [opacities]);

  return { opacities, startStagger, resetStagger };
}

// ─── Count up number ──────────────────────────────────────────────────────────

/**
 * Animates a number from 0 to a target value.
 * Useful for stats cards showing totals on screen enter.
 *
 * Usage:
 *   const { animatedValue, start } = useCountUp(42, 800);
 *   useEffect(() => start(), []);
 *   // animatedValue.interpolate(...) for display
 */
export function useCountUp(target: number, duration = 600) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const start = useCallback(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // value used for text, not transform
    }).start();
  }, [animatedValue, target, duration]);

  return { animatedValue, start };
}
