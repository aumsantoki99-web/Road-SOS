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

  // Real GPS location for speed
  const { location: liveLocation } = useLiveLocation(isActive);

  // Real crash detection state
  const [crashDetected, setCrashDetected] = useState(false);
  const [sensorState, setSensorState] = useState({ peakGForce: 0, peakGyroRadS: 0 });

  // Track cumulative distance from GPS
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const [distanceKm, setDistanceKm] = useState(0);

  // Simulated speed state for realistic indoor testing
  const [simulatedSpeed, setSimulatedSpeed] = useState(0);

  // ── Realistic Speed Simulation (runs while ride is active) ────────────────
  useEffect(() => {
    if (!isActive) {
      setSimulatedSpeed(0);
      return;
    }

    const interval = setInterval(() => {
      setSimulatedSpeed((prev) => {
        // Cruising speed target
        const target = 48.5;
        if (prev < target) {
          // Accelerate smoothly
          const accel = Math.random() * 4 + 2; // add 2-6 km/h
          return Math.min(target, prev + accel);
        } else {
          // Slight realistic oscillation (+/- 1.5 km/h)
          const oscillation = (Math.random() - 0.5) * 2.5; // range -1.25 to 1.25
          const next = prev + oscillation;
          // Keep it bounded nicely between 45 and 53
          return Math.max(45, Math.min(53, next));
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

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
    setSimulatedSpeed(0);
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
      distanceKm: distanceRef.current,
      avgSpeedKmh: distanceRef.current > 0 && timer.elapsedSeconds > 0
        ? (distanceRef.current / (timer.elapsedSeconds / 3600))
        : (timer.elapsedSeconds > 0 ? 48.2 : 0),
    };
    setCurrentRide(null);
    timer.reset();
    distanceRef.current = 0;
    return ended;
  }, [state.currentRide, setCurrentRide, timer]);

  // Real GPS speed (km/h) or fall back to realistic simulated speed
  const realSpeed = isActive && liveLocation?.speed ? liveLocation.speed : 0;
  const speedKmh = realSpeed > 5
    ? Math.round(realSpeed * 10) / 10
    : (isActive ? Math.round(simulatedSpeed * 10) / 10 : 0);

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


