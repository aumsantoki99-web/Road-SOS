/**
 * OSRM routing service to find nearest place by actual road distance.
 */

/**
 * Get road distance and ETA between two points using OSRM.
 * @returns {{ roadKm: number, etaMin: number }} or null on failure
 */
async function getRouteDistance(fromLat, fromLng, toLat, toLng) {
  try {
    // OSRM uses longitude,latitude order
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&steps=false`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RoadSOS/1.0 (Emergency navigation app)',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.code !== 'Ok' || !data.routes?.length) return null

    const route = data.routes[0]
    return {
      roadKm: route.distance / 1000,
      etaMin: Math.ceil(route.duration / 60),
    }
  } catch {
    return null
  }
}

/**
 * Find the nearest place by road distance from a list of places.
 * Takes the top 10 candidates by Haversine and fetches OSRM distances in parallel.
 */
export async function findNearestByRoad(places, userLat, userLng) {
  const candidates = places.slice(0, 10)

  const routedPlaces = await Promise.all(
    candidates.map(async (place) => {
      const route = await getRouteDistance(
        userLat,
        userLng,
        place.lat,
        place.lng
      )

      if (route) {
        return {
          ...place,
          roadKm: route.roadKm,
          etaMin: route.etaMin,
        }
      }

      // Fallback to haversine distance
      return {
        ...place,
        roadKm: place.distance,
        etaMin: 0,
      }
    })
  )

  routedPlaces.sort((a, b) => a.roadKm - b.roadKm)
  return routedPlaces
}
