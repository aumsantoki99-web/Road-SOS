import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';

import type { RideSession } from '../types';
import { navigate } from '../navigation/navigationRef';

export type CrashSeverity = 'minor' | 'moderate' | 'severe';

export interface CrashEvent {
  timestamp: number;
  severity: CrashSeverity;
  gForce?: number;
  gyroRadS?: number;
  latitude?: number;
  longitude?: number;
  speedBeforeKmh?: number;
  speedAfterKmh?: number;
  rideSession?: RideSession;
}

type CrashCallback = (event: CrashEvent) => void;
type SensorSubscription = { remove: () => void };
type SpeedSample = { time: number; speedKmh: number };

const GRAVITY_G = 1.0;
const IMPACT_DURATION_MS = 100;
const GYRO_IMPACT_THRESHOLD_RAD_S = 3.5;
const SPEED_BEFORE_KMH = 20;
const SPEED_AFTER_KMH = 5;
const GPS_VALIDATION_MS = 3000;
const GPS_SAMPLE_MS = 1000;
const DEFAULT_LOCATION = { latitude: 23.0225, longitude: 72.5714 };

let accelSub: SensorSubscription | null = null;
let gyroSub: SensorSubscription | null = null;
let gpsSubscription: { remove: () => void } | null = null;
let accelAboveSince: number | null = null;
let gyroAboveSince: number | null = null;
let impactCandidateTime: number | null = null;
let validatingGps = false;
let peakGForce = 0;
let peakGyroRadS = 0;
let lastLatitude: number | undefined;
let lastLongitude: number | undefined;
let lastSpeedKmh = 0;
const speedHistory: SpeedSample[] = [];
let activeSensitivity: 'low' | 'medium' | 'high' = 'high';

function severityFromGForce(gForce: number): CrashSeverity {
  if (gForce >= 5) return 'severe';
  if (gForce >= 3) return 'moderate';
  return 'minor';
}



function validateWithGps(impactTime: number): { confirmed: boolean; before: number; after: number } {
  const windowEnd = impactTime + GPS_VALIDATION_MS;
  let speedBefore = lastSpeedKmh;
  let speedAfter = lastSpeedKmh;

  for (const sample of speedHistory) {
    if (sample.time <= impactTime) speedBefore = sample.speedKmh;
    if (sample.time >= impactTime && sample.time <= windowEnd) {
      speedAfter = sample.speedKmh;
    }
  }

  // If traveler is stationary or moving at low speed (e.g. testing or lower speed crash), 
  // allow high dynamic force impact validation matching the configured threshold
  if (speedBefore < SPEED_BEFORE_KMH) {
    const thresholdG = CrashDetectionService.getThreshold(activeSensitivity);
    return {
      confirmed: peakGForce >= thresholdG || peakGyroRadS >= GYRO_IMPACT_THRESHOLD_RAD_S,
      before: speedBefore,
      after: speedAfter,
    };
  }

  return {
    confirmed: speedBefore > SPEED_BEFORE_KMH && speedAfter < SPEED_AFTER_KMH,
    before: speedBefore,
    after: speedAfter,
  };
}

export const CrashDetectionService = {
  isActive: false,
  _listeners: [] as CrashCallback[],

  async start(sensitivity: 'low' | 'medium' | 'high' = 'high'): Promise<void> {
    if (CrashDetectionService.isActive) return;

    activeSensitivity = sensitivity;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[CrashDetectionService] Location permission denied; sensor-only validation enabled.');
    }

    CrashDetectionService.isActive = true;
    validatingGps = false;
    accelAboveSince = null;
    gyroAboveSince = null;
    impactCandidateTime = null;
    peakGForce = 0;
    peakGyroRadS = 0;
    speedHistory.length = 0;

    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      if (!CrashDetectionService.isActive || validatingGps) return;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const netG = Math.abs(magnitude - GRAVITY_G);
      peakGForce = Math.max(peakGForce, netG);

      const now = Date.now();
      const thresholdG = CrashDetectionService.getThreshold(activeSensitivity);
      accelAboveSince = netG >= thresholdG ? accelAboveSince ?? now : null;
      CrashDetectionService._checkImpact(now);
    });

    gyroSub = Gyroscope.addListener(({ x, y, z }) => {
      if (!CrashDetectionService.isActive || validatingGps) return;

      const gyroMag = Math.sqrt(x * x + y * y + z * z);
      peakGyroRadS = Math.max(peakGyroRadS, gyroMag);

      const now = Date.now();
      gyroAboveSince = gyroMag >= GYRO_IMPACT_THRESHOLD_RAD_S ? gyroAboveSince ?? now : null;
      CrashDetectionService._checkImpact(now);
    });

    try {
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        lastLatitude = last.coords.latitude;
        lastLongitude = last.coords.longitude;
        if (last.coords.speed !== null && last.coords.speed >= 0) {
          lastSpeedKmh = last.coords.speed * 3.6;
        }
        speedHistory.push({ time: Date.now(), speedKmh: lastSpeedKmh });
      }
    } catch (err) {
      console.warn('[CrashDetectionService] Failed to get initial last known position:', err);
    }

    try {
      gpsSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (position) => {
          lastLatitude = position.coords.latitude;
          lastLongitude = position.coords.longitude;

          if (position.coords.speed !== null && position.coords.speed >= 0) {
            lastSpeedKmh = position.coords.speed * 3.6;
          }

          speedHistory.push({ time: Date.now(), speedKmh: lastSpeedKmh });
          if (speedHistory.length > 30) speedHistory.shift();
        }
      );
    } catch (err) {
      console.warn('[CrashDetectionService] Failed to start passive watchPositionAsync:', err);
    }
  },

  stop(): void {
    CrashDetectionService.isActive = false;
    accelSub?.remove();
    gyroSub?.remove();
    accelSub = null;
    gyroSub = null;

    if (gpsSubscription) {
      gpsSubscription.remove();
      gpsSubscription = null;
    }
  },

  onCrashDetected(callback: CrashCallback): () => void {
    CrashDetectionService._listeners.push(callback);
    return () => {
      CrashDetectionService._listeners = CrashDetectionService._listeners.filter((cb) => cb !== callback);
    };
  },

  getSensorState(): {
    monitoring: boolean;
    peakGForce: number;
    peakGyroRadS: number;
    lastSpeedKmh: number;
  } {
    return {
      monitoring: CrashDetectionService.isActive,
      peakGForce,
      peakGyroRadS,
      lastSpeedKmh,
    };
  },

  getThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
    const thresholds = { low: 4.0, medium: 2.5, high: 1.8 };
    return thresholds[sensitivity];
  },

  _checkImpact(now: number): void {
    if (impactCandidateTime !== null) return;

    const accelDuration = accelAboveSince !== null ? now - accelAboveSince : 0;
    const gyroDuration = gyroAboveSince !== null ? now - gyroAboveSince : 0;
    const accelHit = accelAboveSince !== null && accelDuration >= IMPACT_DURATION_MS;
    const gyroHit = gyroAboveSince !== null && gyroDuration >= IMPACT_DURATION_MS;

    if (!accelHit && !gyroHit) return;

    impactCandidateTime = now;
    validatingGps = true;
    accelAboveSince = null;
    gyroAboveSince = null;

    setTimeout(() => {
      if (!validatingGps || impactCandidateTime === null) return;

      const validation = validateWithGps(impactCandidateTime);
      validatingGps = false;
      const eventTime = impactCandidateTime;
      impactCandidateTime = null;

      if (validation.confirmed) {
        CrashDetectionService._notifyListeners({
          timestamp: eventTime,
          severity: severityFromGForce(peakGForce),
          gForce: peakGForce,
          gyroRadS: peakGyroRadS,
          latitude: lastLatitude ?? DEFAULT_LOCATION.latitude,
          longitude: lastLongitude ?? DEFAULT_LOCATION.longitude,
          speedBeforeKmh: validation.before,
          speedAfterKmh: validation.after,
        });
      } else {
        // Reset peaks since this impact candidate failed validation
        peakGForce = 0;
        peakGyroRadS = 0;
      }
    }, GPS_VALIDATION_MS);
  },

  _notifyListeners(event: CrashEvent): void {
    CrashDetectionService._listeners.forEach((callback) => callback(event));
    try {
      navigate('CrashCountdown', { event });
    } catch (e) {
      console.warn('[CrashDetectionService] Failed to navigate to CrashCountdown overlay:', e);
    }
  },

  _simulateCrash(severity: CrashSeverity = 'moderate'): void {
    const gForce = severity === 'minor' ? 2.0 : severity === 'moderate' ? 3.5 : 6.0;
    CrashDetectionService._notifyListeners({
      timestamp: Date.now(),
      severity,
      gForce,
      latitude: lastLatitude ?? DEFAULT_LOCATION.latitude,
      longitude: lastLongitude ?? DEFAULT_LOCATION.longitude,
      speedBeforeKmh: lastSpeedKmh,
      speedAfterKmh: 0,
    });
  },
};
