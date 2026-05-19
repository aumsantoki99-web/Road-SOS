/**
 * useReducedMotion — Respects system "Reduce Motion" accessibility setting
 *
 * When the user has enabled "Reduce Motion" in their device settings:
 *   iOS:     Settings → Accessibility → Motion → Reduce Motion
 *   Android: Settings → Accessibility → Remove Animations
 *
 * Animations should either be disabled or replaced with simple fades.
 * This is especially important for the SOS pulse rings and ride gauge
 * which have continuous looping animations.
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   // In animation: if (prefersReducedMotion) return; // skip loop
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Read initial value
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setPrefersReducedMotion)
      .catch(() => setPrefersReducedMotion(false));

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setPrefersReducedMotion,
    );

    return () => subscription.remove();
  }, []);

  return prefersReducedMotion;
}
