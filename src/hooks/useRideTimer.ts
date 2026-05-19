/**
 * useRideTimer — Ride duration timer
 *
 * Manages elapsed ride time with start, pause, and stop controls.
 * Uses Date.now() reference points instead of incrementing a counter —
 * this prevents drift if the JS thread is busy.
 *
 * Ticks every second. Cleaned up automatically on unmount.
 *
 * Usage:
 *   const { elapsedSeconds, isRunning, start, pause, stop, reset } = useRideTimer();
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface RideTimerResult {
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
}

export function useRideTimer(): RideTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Track when the current "run" started, and how much was already elapsed
  const startedAtRef   = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = (): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback((): void => {
    if (isRunning) return;
    startedAtRef.current = Date.now();
    setIsRunning(true);
  }, [isRunning]);

  const pause = useCallback((): void => {
    if (!isRunning) return;
    // Snapshot elapsed so far
    if (startedAtRef.current !== null) {
      accumulatedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000);
    }
    startedAtRef.current = null;
    setIsRunning(false);
    clearTick();
  }, [isRunning]);

  const stop = useCallback((): void => {
    pause();
    // Preserve final elapsed — caller reads it for ride summary
  }, [pause]);

  const reset = useCallback((): void => {
    clearTick();
    setIsRunning(false);
    setElapsedSeconds(0);
    accumulatedRef.current = 0;
    startedAtRef.current = null;
  }, []);

  // Tick every second while running
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (startedAtRef.current !== null) {
        const liveSecs = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsedSeconds(accumulatedRef.current + liveSecs);
      }
    }, 1000);

    return clearTick;
  }, [isRunning]);

  return { elapsedSeconds, isRunning, start, pause, stop, reset };
}
