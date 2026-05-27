import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { EMERGENCY_DATABASE_SERVER, STORAGE_KEYS } from '../constants';
import type { EmergencyPlace, EmergencyPlaceType } from '../types';

const SYNC_DISTANCE_THRESHOLD_KM = 20;

interface EmergencyPlacesCachePayload {
  last_sync_lat: number | null;
  last_sync_lng: number | null;
  last_sync_time: number | null;
  places: EmergencyPlace[];
}

interface SyncEmergencyResponse {
  success?: boolean;
  places?: unknown[];
}

export interface NearbyEmergencyPlace extends EmergencyPlace {
  distanceKm: number;
}

type RawEmergencyPlace = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizePlaceType(value: unknown): EmergencyPlaceType {
  const raw = toStringValue(value)?.toLowerCase() ?? 'other';
  if (raw.includes('hospital')) return 'hospital';
  if (raw.includes('police')) return 'police';
  if (raw.includes('trauma')) return 'trauma';
  return 'other';
}

function normalizePlace(raw: RawEmergencyPlace, index: number): EmergencyPlace | null {
  const name = toStringValue(raw.name);
  const latitude = toNumber(raw.lat) ?? toNumber(raw.latitude);
  const longitude = toNumber(raw.lng) ?? toNumber(raw.longitude);
  if (!name || latitude === null || longitude === null) return null;

  const type = normalizePlaceType(raw.type ?? raw.category ?? raw.kind);
  const id = toStringValue(raw.id) ?? `${type}-${index}`;
  const address = toStringValue(raw.address) ?? 'Address unavailable';
  const phone = toStringValue(raw.phone) ?? '';

  return {
    id,
    name,
    address,
    phone,
    type,
    latitude,
    longitude,
  };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a =
    0.5 - c((lat2 - lat1) * p) / 2
    + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

async function getCachePayload(): Promise<EmergencyPlacesCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_PLACES_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as EmergencyPlacesCachePayload;
  } catch (error) {
    console.warn('[EmergencyDatabaseService] Failed to parse cache payload:', error);
    return null;
  }
}

async function setCachePayload(payload: EmergencyPlacesCachePayload): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_PLACES_CACHE, JSON.stringify(payload));
}

export async function getCachedEmergencyPlaces(): Promise<EmergencyPlace[]> {
  const payload = await getCachePayload();
  if (!payload?.places) return [];
  return payload.places;
}

export async function getNearestCachedPlaces(
  currentLat: number,
  currentLng: number,
  type: EmergencyPlaceType,
  maxResults = 50,
): Promise<NearbyEmergencyPlace[]> {
  const places = await getCachedEmergencyPlaces();

  const normalizedType = type === 'other' ? 'other' : type;
  return places
    .filter((place) => place.type === normalizedType)
    .map((place) => ({
      ...place,
      distanceKm: calculateDistance(currentLat, currentLng, place.latitude, place.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults);
}

export async function syncEmergencyDatabaseIfNeeded(
  currentLat: number,
  currentLng: number,
): Promise<boolean> {
  try {
    const network = await NetInfo.fetch();
    if (!network.isConnected) return false;

    const payload = await getCachePayload();
    const lastLat = payload?.last_sync_lat ?? null;
    const lastLng = payload?.last_sync_lng ?? null;

    let shouldSync = false;
    if (lastLat === null || lastLng === null) {
      shouldSync = true;
    } else {
      const movedDistanceKm = calculateDistance(currentLat, currentLng, lastLat, lastLng);
      shouldSync = movedDistanceKm > SYNC_DISTANCE_THRESHOLD_KM;
    }

    if (!shouldSync) return false;

    const response = await fetch(
      `${EMERGENCY_DATABASE_SERVER}/sync-emergency?lat=${currentLat}&lng=${currentLng}`,
    );
    if (!response.ok) return false;

    const result = (await response.json()) as SyncEmergencyResponse;
    if (!result.success || !Array.isArray(result.places)) return false;

    const places = result.places
      .map((place, index) => normalizePlace(place as RawEmergencyPlace, index))
      .filter((place): place is EmergencyPlace => place !== null);

    await setCachePayload({
      last_sync_lat: currentLat,
      last_sync_lng: currentLng,
      last_sync_time: Date.now(),
      places,
    });

    return true;
  } catch (error) {
    console.warn('[EmergencyDatabaseService] Failed to sync emergency database:', error);
    return false;
  }
}

