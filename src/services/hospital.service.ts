/**
 * HospitalService — Placeholder
 *
 * Integration point for nearby hospital lookup.
 *
 * When connecting real hospital data:
 *   Option A — Google Places API:
 *     const response = await fetch(
 *       `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
 *       `location=${lat},${lng}&radius=5000&type=hospital&key=${GOOGLE_API_KEY}`
 *     );
 *
 *   Option B — OpenStreetMap Overpass API (free):
 *     const query = `[out:json];node["amenity"="hospital"](around:5000,${lat},${lng});out;`;
 *     const response = await fetch('https://overpass-api.de/api/interpreter', {
 *       method: 'POST', body: query,
 *     });
 *
 * Setup:
 *   1. npx expo install expo-location
 *   2. Add GOOGLE_MAPS_API_KEY to app.json > android.config / ios.config
 *   3. Request location permissions before calling getNearby()
 *
 * DO NOT implement real API calls here.
 * This file is owned by: feature/placeholder-services
 */

import { mockHospitals } from '../mock';
import type { Hospital } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface HospitalSearchOptions {
  radiusMeters?: number;
  emergencyOnly?: boolean;
  maxResults?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const HospitalService = {

  /**
   * Get the user's current location.
   *
   * TODO: Replace with real implementation:
   *   import * as Location from 'expo-location';
   *   const { status } = await Location.requestForegroundPermissionsAsync();
   *   if (status !== 'granted') throw new Error('Location permission denied');
   *   const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
   *   return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
   */
  async getUserLocation(): Promise<UserLocation> {
    console.warn('[HospitalService] getUserLocation() — mock. Wire expo-location here.');
    // Mock location — Ahmedabad, Gujarat
    return { latitude: 23.0225, longitude: 72.5714 };
  },

  /**
   * Fetch nearby hospitals for the given location.
   *
   * Returns mock data until real API is connected.
   *
   * TODO: Replace with Google Places API call (see file header).
   */
  async getNearby(
    _location: UserLocation,
    options: HospitalSearchOptions = {},
  ): Promise<Hospital[]> {
    const { emergencyOnly = false, maxResults = 10 } = options;

    console.warn('[HospitalService] getNearby() — mock data. Wire Google Places API here.');

    // Mock: filter and sort by distance
    let results = [...mockHospitals];
    if (emergencyOnly) {
      results = results.filter((h) => h.isEmergencyCenter);
    }
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results.slice(0, maxResults);
  },

  /**
   * Get details for a single hospital by ID.
   *
   * TODO: Replace with Google Place Details API:
   *   await fetch(
   *     `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${KEY}`
   *   );
   */
  async getById(id: string): Promise<Hospital | null> {
    console.warn('[HospitalService] getById() — mock:', id);
    return mockHospitals.find((h) => h.id === id) ?? null;
  },

  /**
   * Calculate ETA to a hospital from the user's location.
   *
   * TODO: Replace with Google Directions API or Distance Matrix:
   *   await fetch(
   *     `https://maps.googleapis.com/maps/api/directions/json?` +
   *     `origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&key=${KEY}`
   *   );
   */
  async getETA(
    _from: UserLocation,
    _to: UserLocation,
  ): Promise<number> {
    console.warn('[HospitalService] getETA() — mock. Wire Google Directions API here.');
    // Mock ETA in minutes
    return Math.floor(Math.random() * 15) + 5;
  },
} as const;
