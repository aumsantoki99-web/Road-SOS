/**
 * Calculate the Haversine distance between two lat/lng points.
 * @returns distance in kilometers
 */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371.0
  const toRad = (d) => (d * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Format a distance in km to a human-readable label.
 */
export function distLabel(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(2)} km`
}
