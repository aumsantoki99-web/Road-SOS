/**
 * useRideSession — Ride session state manager
 *
 * Orchestrates the full ride lifecycle:
 *   idle → active → (paused →) active → ended
 *
 * Integrates:
 *   - useRideTimer for elapsed time
 *   - AppStateContext for global ride state (so Home screen reflects it)
 *   - CrashDetectionService — REAL accelerometer + gyroscope monitoring
 *   - useLiveLocation — REAL GPS speed and distance
 *
 * Usage:
 *   const ride = useRideSession();
 *   ride.startRide();
 *   ride.stopRide();
 *   ride.elapsedSeconds  // current duration
 *   ride.peakGForce      // real sensor reading
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useRideTimer } from './useRideTimer';
import { useLiveLocation } from './useLiveLocation';
import { generateId } from '../utils';
import { CrashDetectionService } from '../services/crashDetection.service';
import type { RideSession, RideStatus } from '../types';

interface RideSessionResult {
  status: RideStatus;
  elapsedSeconds: number;
  speedKmh: number;
  distanceKm: number;
  crashDetected: boolean;
  peakGForce: number;
  peakGyroRadS: number;
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

  const status: RideStatus = state.currentRide?.status ?? 'idle';
  const isActive = status === 'active';

  // Real GPS location for speed (keep tracking if auto-start is enabled)
  const shouldTrackLocation = isActive || state.preferences.rideAutoStart;
  const { location: liveLocation } = useLiveLocation(shouldTrackLocation);

  // Real crash detection state
  const [crashDetected, setCrashDetected] = useState(false);
  const [sensorState, setSensorState] = useState({ peakGForce: 0, peakGyroRadS: 0 });

  // Track cumulative distance from GPS
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const [distanceKm, setDistanceKm] = useState(0);

  // ── Realistic Speed Simulation (runs while ride is active) ────────────────
  // Removed. Now using actual GPS speed from liveLocation.

  // ── GPS distance accumulation (runs on each location update) ─────────────
  useEffect(() => {
    if (!isActive || !liveLocation) return;
    if (lastLocationRef.current) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(liveLocation.latitude - lastLocationRef.current.latitude);
      const dLon = toRad(liveLocation.longitude - lastLocationRef.current.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lastLocationRef.current.latitude)) *
          Math.cos(toRad(liveLocation.latitude)) *
          Math.sin(dLon / 2) ** 2;
      const delta = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceRef.current += delta;
      setDistanceKm(Math.round(distanceRef.current * 100) / 100);
    }
    lastLocationRef.current = { latitude: liveLocation.latitude, longitude: liveLocation.longitude };
  }, [isActive, liveLocation]);

  // ── Sensor poll — stable interval, only depends on isActive ──────────────
  useEffect(() => {
    if (!isActive) return;
    const sensorPoll = setInterval(() => {
      const s = CrashDetectionService.getSensorState();
      setSensorState({
        peakGForce: Math.round(s.peakGForce * 10) / 10,
        peakGyroRadS: Math.round(s.peakGyroRadS * 10) / 10,
      });
    }, 500);
    return () => clearInterval(sensorPoll);
  }, [isActive]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startRide = useCallback((): void => {
    const id = generateId();
    const session: RideSession = {
      id,
      startTime: Date.now(),
      status: 'active',
      crashDetected: false,
    };
    // Reset tracking state
    distanceRef.current = 0;
    lastLocationRef.current = null;
    setDistanceKm(0);
    setCrashDetected(false);
    setSensorState({ peakGForce: 0, peakGyroRadS: 0 });

    setCurrentRide(session);
    timer.start();

    // Start real crash detection sensors
    void CrashDetectionService.start(state.preferences.crashSensitivity);
    CrashDetectionService.onCrashDetected(() => {
      setCrashDetected(true);
    });
  }, [setCurrentRide, timer, state.preferences.crashSensitivity]);

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

    // Stop sensors
    CrashDetectionService.stop();

    const ended: RideSession = {
      ...state.currentRide,
      status: 'ended',
      endTime: Date.now(),
      crashDetected,
      distanceKm: distanceRef.current,
      avgSpeedKmh: distanceRef.current > 0 && timer.elapsedSeconds > 0
        ? (distanceRef.current / (timer.elapsedSeconds / 3600))
        : 0,
    };
    setCurrentRide(null);
    timer.reset();
    distanceRef.current = 0;
    
    // Save to local storage asynchronously
    import('../storage/StorageService').then(({ StorageService }) => {
      import('../constants').then(({ STORAGE_KEYS }) => {
        StorageService.set(STORAGE_KEYS.LAST_RIDE, ended).catch(console.warn);
      });
    });

    return ended;
  }, [state.currentRide, setCurrentRide, timer, crashDetected]);

  // Real GPS speed (km/h)
  const realSpeed = isActive && liveLocation?.speed ? liveLocation.speed : 0;
  const speedKmh = Math.round(realSpeed * 10) / 10;

  // Auto-start logic removed as user requested manual start.

  return {
    status,
    elapsedSeconds:  timer.elapsedSeconds,
    speedKmh,
    distanceKm,
    crashDetected,
    peakGForce:      sensorState.peakGForce,
    peakGyroRadS:    sensorState.peakGyroRadS,
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


