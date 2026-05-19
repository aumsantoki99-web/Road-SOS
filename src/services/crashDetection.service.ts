/**
 * CrashDetectionService — Placeholder
 *
 * Integration point for the ML crash detection module.
 *
 * When connecting real crash detection:
 *   1. Install accelerometer module:
 *      npx expo install expo-sensors
 *   2. Install ML model (TensorFlow Lite or custom):
 *      npx expo install @tensorflow/tfjs-react-native
 *   3. Replace the mock bodies below with real sensor reads
 *   4. Wire onCrashDetected() callback into RideMonitoringScreen
 *
 * Architecture note:
 *   This service uses the observer pattern — callers subscribe to
 *   crash events via onCrashDetected(), rather than polling.
 *   This ensures zero performance cost when no crash occurs.
 *
 * DO NOT implement real sensor logic here.
 * This file is owned by: feature/placeholder-services
 */

import type { RideSession } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CrashSeverity = 'minor' | 'moderate' | 'severe';

export interface CrashEvent {
  timestamp: number;
  severity: CrashSeverity;
  /** G-force at moment of impact — populated by accelerometer */
  gForce?: number;
  /** GPS coordinates at time of crash — populated by location service */
  latitude?: number;
  longitude?: number;
  /** Active ride session when crash occurred */
  rideSession?: RideSession;
}

type CrashCallback = (event: CrashEvent) => void;

// ─── Service ──────────────────────────────────────────────────────────────────

export const CrashDetectionService = {

  /** Whether the service is actively monitoring */
  isActive: false,

  /** Registered crash event callbacks */
  _listeners: [] as CrashCallback[],

  /**
   * Start crash detection monitoring.
   *
   * TODO: Replace with real implementation:
   *   const subscription = Accelerometer.addListener(({ x, y, z }) => {
   *     const gForce = Math.sqrt(x * x + y * y + z * z);
   *     if (gForce > threshold) this._notifyListeners({ gForce, ... });
   *   });
   *   Accelerometer.setUpdateInterval(100); // 10Hz
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    console.warn('[CrashDetectionService] start() — mock mode. Wire expo-sensors here.');
    // TODO: Accelerometer.addListener(this._onAccelerometerData.bind(this));
  },

  /**
   * Stop crash detection monitoring and release sensor resources.
   *
   * TODO: subscription.remove() when real sensor is connected.
   */
  stop(): void {
    this.isActive = false;
    console.warn('[CrashDetectionService] stop() — mock mode.');
    // TODO: subscription.remove();
  },

  /**
   * Register a callback to be called when a crash is detected.
   * Returns an unsubscribe function.
   *
   * Usage in RideMonitoringScreen:
   *   useEffect(() => {
   *     const unsub = CrashDetectionService.onCrashDetected(handleCrash);
   *     return unsub;
   *   }, []);
   */
  onCrashDetected(callback: CrashCallback): () => void {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((cb) => cb !== callback);
    };
  },

  /**
   * Internal: notify all registered listeners of a crash event.
   * Called by the accelerometer handler when impact threshold is exceeded.
   */
  _notifyListeners(event: CrashEvent): void {
    this._listeners.forEach((cb) => cb(event));
  },

  /**
   * Get the G-force threshold for the given sensitivity level.
   *
   * TODO: calibrate these values with real-world test data.
   */
  getThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
    const thresholds = { low: 4.0, medium: 2.5, high: 1.8 };
    return thresholds[sensitivity];
  },

  /**
   * Simulate a crash event — for UI testing only.
   * Remove before production.
   */
  _simulateCrash(severity: CrashSeverity = 'moderate'): void {
    const event: CrashEvent = {
      timestamp: Date.now(),
      severity,
      gForce: severity === 'minor' ? 2.0 : severity === 'moderate' ? 3.5 : 6.0,
    };
    console.warn('[CrashDetectionService] Simulated crash:', event);
    this._notifyListeners(event);
  },
};
