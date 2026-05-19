/**
 * useScreenReader — Detects if VoiceOver (iOS) or TalkBack (Android) is active
 *
 * When a screen reader is active, some UI behaviours should change:
 *   - Decorative animations pause (less cognitive noise)
 *   - Touch targets become more generous
 *   - Status updates are announced programmatically
 *
 * Usage:
 *   const isScreenReaderActive = useScreenReader();
 *   // If true: skip decorative animations, use AccessibilityInfo.announce
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useScreenReader(): boolean {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setIsActive)
      .catch(() => setIsActive(false));

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsActive,
    );

    return () => subscription.remove();
  }, []);

  return isActive;
}
