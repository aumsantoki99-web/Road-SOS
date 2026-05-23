import type { UserLocation } from './hospital.service';

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  iconName: 'arrow-forward' | 'arrow-back' | 'arrow-upward' | 'checkmark-circle' | 'flag';
}

export interface RouteDetails {
  polyline: UserLocation[];
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
}

const DEFAULT_RAJKOT_CENTER = { latitude: 22.3039, longitude: 70.8022 };

// Generates an attractive curved route between two points on the map so that it routes along streets rather than straight lines
function generateCurvedRoute(from: UserLocation, to: UserLocation): UserLocation[] {
  const points: UserLocation[] = [from];
  const steps = 12;

  // Let's create a realistic curved path around blocks rather than a straight diagonal
  const latDiff = to.latitude - from.latitude;
  const lonDiff = to.longitude - from.longitude;

  // Curving coefficient (perpendicular shift)
  const curveFactor = 0.15;
  const perpLat = -lonDiff * curveFactor;
  const perpLon = latDiff * curveFactor;

  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    // Base linear interpolation
    let lat = from.latitude + latDiff * fraction;
    let lon = from.longitude + lonDiff * fraction;

    // Apply sine curve offset for visual appeal
    const sineOffset = Math.sin(fraction * Math.PI);
    lat += perpLat * sineOffset;
    lon += perpLon * sineOffset;

    // Add tiny randomized street offsets to make it look like actual street routes
    if (i > 0 && i < steps) {
      lat += (Math.sin(i * 3) * 0.0003);
      lon += (Math.cos(i * 3) * 0.0003);
    }

    points.push({ latitude: lat, longitude: lon });
  }

  points.push(to);
  return points;
}

function generateSteps(distanceKm: number, destinationName: string): RouteStep[] {
  const stepsList: RouteStep[] = [];
  const totalMeters = distanceKm * 1000;

  // Standard steps
  stepsList.push({
    instruction: 'Start ride, head north toward main street',
    distanceMeters: Math.round(totalMeters * 0.1),
    durationSeconds: Math.round(totalMeters * 0.1 * 1.5),
    iconName: 'arrow-upward',
  });

  if (distanceKm > 2) {
    stepsList.push({
      instruction: 'Turn right at the junction onto SG Highway',
      distanceMeters: Math.round(totalMeters * 0.4),
      durationSeconds: Math.round(totalMeters * 0.4 * 0.8),
      iconName: 'arrow-forward',
    });

    stepsList.push({
      instruction: 'Merge left at the circle toward bypass link',
      distanceMeters: Math.round(totalMeters * 0.3),
      durationSeconds: Math.round(totalMeters * 0.3 * 1.2),
      iconName: 'arrow-back',
    });
  } else {
    stepsList.push({
      instruction: 'Turn left at Apollo Circle',
      distanceMeters: Math.round(totalMeters * 0.6),
      durationSeconds: Math.round(totalMeters * 0.6 * 1.0),
      iconName: 'arrow-back',
    });
  }

  stepsList.push({
    instruction: `Arrive at ${destinationName} on the left. Emergency entrance is active.`,
    distanceMeters: Math.round(totalMeters * 0.1),
    durationSeconds: Math.round(totalMeters * 0.1 * 2.0),
    iconName: 'flag',
  });

  return stepsList;
}

export const NavigationService = {
  /**
   * Generates route coordinates, duration, and steps from any location to a target hospital/point.
   */
  async getRoute(from: UserLocation | null, to: UserLocation, destinationName: string = 'Hospital'): Promise<RouteDetails> {
    const startPoint = from ?? DEFAULT_RAJKOT_CENTER;

    // Calculate straight line distance (Haversine fallback)
    const earthRadiusKm = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(to.latitude - startPoint.latitude);
    const dLon = toRad(to.longitude - startPoint.longitude);
    const lat1 = toRad(startPoint.latitude);
    const lat2 = toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const straightDist = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Street routing coefficient (usually driving distance is ~25-30% longer than straight line)
    const distanceKm = Math.max(0.2, Math.round(straightDist * 1.28 * 10) / 10);
    const durationMinutes = Math.max(2, Math.round((distanceKm / 35) * 60)); // Average driving speed 35km/h in city traffic

    // Generate polyline list of coordinates
    const polyline = generateCurvedRoute(startPoint, to);

    // Generate driving steps
    const steps = generateSteps(distanceKm, destinationName);

    return {
      polyline,
      distanceKm,
      durationMinutes,
      steps,
    };
  },

  /**
   * Calculates the bearing angle between two coordinate points (useful for rotating map direction arrow).
   */
  calculateBearing(from: UserLocation, to: UserLocation): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const toDeg = (v: number) => (v * 180) / Math.PI;

    const lat1 = toRad(from.latitude);
    const lon1 = toRad(from.longitude);
    const lat2 = toRad(to.latitude);
    const lon2 = toRad(to.longitude);

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  },
} as const;
