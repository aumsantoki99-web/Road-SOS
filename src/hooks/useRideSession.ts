/**
 * useRideSession — Ride session state manager
 *
 * Orchestrates the full ride lifecycle:
 *   idle → active → (paused →) active → ended
 *
 * Integrates:
 *   - useRideTimer for elapsed time
 *   - AppStateContext for global ride state (so Home screen reflects it)
 *   - Mock speed/distance (replaced by GPS module in future)
 *
 * Crash detection: mock only. crashDetected is always false.
 * TODO: wire to CrashDetectionService in feature/placeholder-services.
 *
 * Usage:
 *   const ride = useRideSession();
 *   ride.startRide();
 *   ride.stopRide();
 *   ride.elapsedSeconds  // current duration
 */

import { useCallback, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useRideTimer } from './useRideTimer';
import { generateId } from '../utils';
import { MOCK_CONSTANTS } from '../constants';
import type { RideSession, RideStatus } from '../types';

interface RideSessionResult {
  status: RideStatus;
  elapsedSeconds: number;
  /** Mock only — replaced by GPS */
  speedKmh: number;
  /** Mock only — replaced by GPS */
  distanceKm: number;
  /** Mock only — always false */
  crashDetected: boolean;
  currentSession: RideSession | null;
  startRide: () => void;
  pauseRide: () => void;
  resumeRide: () => void;
  stopRide: () => RideSession | null;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
}

export function useRideSession(): RideSessionResult {
  const { state, setCurrentRide } = useAppState();
  const timer = useRideTimer();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const status: RideStatus = state.currentRide?.status ?? 'idle';

  // ── Actions ───────────────────────────────────────────────────────────────

  const startRide = useCallback((): void => {
    const id = generateId();
    const session: RideSession = {
      id,
      startTime: Date.now(),
      status: 'active',
      crashDetected: false, // mock only
    };
    setSessionId(id);
    setCurrentRide(session);
    timer.start();
  }, [setCurrentRide, timer]);

  const pauseRide = useCallback((): void => {
    if (!state.currentRide) return;
    setCurrentRide({ ...state.currentRide, status: 'paused' });
    timer.pause();
  }, [state.currentRide, setCurrentRide, timer]);

  const resumeRide = useCallback((): void => {
    if (!state.currentRide) return;
    setCurrentRide({ ...state.currentRide, status: 'active' });
    timer.start();
  }, [state.currentRide, setCurrentRide, timer]);

  const stopRide = useCallback((): RideSession | null => {
    if (!state.currentRide) return null;
    timer.stop();
    const ended: RideSession = {
      ...state.currentRide,
      status: 'ended',
      endTime: Date.now(),
      distanceKm: MOCK_CONSTANTS.MOCK_DISTANCE_KM, // replaced by GPS
      avgSpeedKmh: MOCK_CONSTANTS.MOCK_SPEED_KMH,  // replaced by GPS
    };
    setCurrentRide(null);
    setSessionId(null);
    timer.reset();
    return ended;
    // TODO (feature/local-storage): StorageService.saveRideSession(ended)
  }, [state.currentRide, setCurrentRide, timer]);

  // Mock live values — replaced by GPS/accelerometer module
  const mockSpeed = status === 'active'
    ? MOCK_CONSTANTS.MOCK_SPEED_KMH + Math.sin(Date.now() / 3000) * 4
    : 0;

  const mockDistance = status === 'active' || status === 'paused'
    ? (timer.elapsedSeconds / 3600) * MOCK_CONSTANTS.MOCK_SPEED_KMH
    : 0;

  return {
    status,
    elapsedSeconds:  timer.elapsedSeconds,
    speedKmh:        Math.max(0, Math.round(mockSpeed * 10) / 10),
    distanceKm:      Math.round(mockDistance * 100) / 100,
    crashDetected:   false, // mock only — never implement real logic here
    currentSession:  state.currentRide,
    startRide,
    pauseRide,
    resumeRide,
    stopRide,
    canStart:  status === 'idle',
    canPause:  status === 'active',
    canResume: status === 'paused',
    canStop:   status === 'active' || status === 'paused',
  };
}
