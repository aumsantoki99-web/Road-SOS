import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseLiveLocationResult {
  location: LocationData | null;
  errorMsg: string | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useLiveLocation(enabled: boolean = true): UseLiveLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  async function requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setErrorMsg('Location permission was denied');
      } else {
        setErrorMsg(null);
      }
      return granted;
    } catch (e) {
      console.error('[useLiveLocation] Permission request failed:', e);
      setErrorMsg('Failed to request permission');
      return false;
    }
  }

  useEffect(() => {
    let active = true;

    async function startWatching(): Promise<void> {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        let currentGranted = status === 'granted';
        setPermissionGranted(currentGranted);

        if (!currentGranted) {
          currentGranted = await requestPermission();
        }

        if (!currentGranted) return;

        // Get initial location quickly
        const initial = await Location.getLastKnownPositionAsync({});
        if (initial && active) {
          setLocation({
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
            heading: initial.coords.heading,
            speed: initial.coords.speed !== null && initial.coords.speed >= 0 ? initial.coords.speed * 3.6 : 0, // convert to km/h
            timestamp: initial.timestamp,
          });
        }

        // Start watching for changes
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
        }

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (newLocation) => {
            if (active) {
              setLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                heading: newLocation.coords.heading,
                speed: newLocation.coords.speed !== null && newLocation.coords.speed >= 0 ? newLocation.coords.speed * 3.6 : 0, // convert to km/h
                timestamp: newLocation.timestamp,
              });
              setErrorMsg(null);
            }
          }
        );
      } catch (e) {
        console.warn('[useLiveLocation] Failed to start location tracking:', e);
        if (active) setErrorMsg('Failed to track location');
      }
    }

    if (enabled) {
      void startWatching();
    } else {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    }

    return () => {
      active = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [enabled]);

  return {
    location,
    errorMsg,
    permissionGranted,
    requestPermission,
  };
}
