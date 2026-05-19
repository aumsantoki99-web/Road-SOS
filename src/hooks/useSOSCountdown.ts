/**
 * useSOSCountdown — SOS auto-send countdown
 *
 * Counts down from a given number of seconds.
 * When it reaches 0, calls onComplete (trigger emergency alert).
 * Cancel stops the countdown and calls onCancel.
 *
 * Used by: SOSConfirmationScreen
 *
 * TODO (feature/placeholder-services):
 *   Replace onComplete body with EmergencyService.triggerSOS()
 *
 * Usage:
 *   const { count, cancel, isCancelled } = useSOSCountdown({
 *     seconds: 10,
 *     onComplete: () => EmergencyService.triggerSOS(),
 *     onCancel: () => navigation.goBack(),
 *   });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface SOSCountdownOptions {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

interface SOSCountdownResult {
  count: number;
  cancel: () => void;
  isCancelled: boolean;
  /** 0–1 progress (1 = full, 0 = expired) */
  progress: number;
}

export function useSOSCountdown({
  seconds,
  onComplete,
  onCancel,
}: SOSCountdownOptions): SOSCountdownResult {
  const [count, setCount] = useState(seconds);
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isCancelled) return;

    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      if (!cancelledRef.current) {
        setCount((prev) => prev - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, isCancelled, onComplete]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
    onCancel();
  }, [onCancel]);

  return {
    count,
    cancel,
    isCancelled,
    progress: count / seconds,
  };
}
