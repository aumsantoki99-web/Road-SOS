/**
 * Overpass API service for searching nearby places using OpenStreetMap.
 */

import { haversine } from '../utils/haversine'
import CATEGORIES from '../constants/categories'

const OVERPASS_PRIMARY = 'https://overpass-api.de/api/interpreter'
const OVERPASS_BACKUP = 'https://overpass.kumi.systems/api/interpreter'

/** Specialty words to filter out non-trauma hospitals */
const SPECIALTY_FILTER_WORDS = [
  'dental', 'dentist', 'teeth', 'tooth', 'orthodont',
  'eye', 'optic', 'vision', 'ophthalmol', 'lasik', 'retina',
  'skin', 'dermatol', 'derma',
  'psychiat', 'psycholog', 'mental health', 'de-addiction',
  "children's", 'childrens', 'paediatric', 'pediatric',
  "women's", 'womens', 'maternity', 'gynaecol', 'gynecol',
  'obstetric', 'gynae', 'lady', 'ladies',
  'physiother', 'physio', 'rehabilitation',
  'cosmetic', 'aesthetic', 'beauty', 'plastic surgery',
  'veterinar', 'vet clinic', 'animal',
  'homeopat', 'homoeopat', 'ayurved', 'unani', 'naturopath',
  'siddha', 'yunani',
]

/**
 * Build the Overpass QL query for a given category.
 */
function buildOverpassQuery(category, lat, lng, radiusKm) {
  const cat = CATEGORIES[category]
  if (!cat) throw new Error(`Unknown category: ${category}`)

  const queries = cat.queries
  const isHosp = cat.isHospital === true
  const radiusM = Math.round(radiusKm * 1000)

  const extraFilter = isHosp
    ? '["healthcare"!="dentist"]["healthcare"!="optometrist"]["healthcare"!="physiotherapist"]["healthcare"!="psychologist"]["speciality"!="dentistry"]["speciality"!="ophthalmology"]["speciality"!="dermatology"]["speciality"!="psychiatry"]'
    : ''

  let queryStr = '[out:json][timeout:30];('
  for (const q of queries) {
    queryStr += `node["${q.key}"="${q.value}"]${extraFilter}(around:${radiusM},${lat},${lng});`
    queryStr += `way["${q.key}"="${q.value}"]${extraFilter}(around:${radiusM},${lat},${lng});`
    queryStr += `relation["${q.key}"="${q.value}"]${extraFilter}(around:${radiusM},${lat},${lng});`
  }
  queryStr += ');out center;'
  return queryStr
}

/**
 * Parse Overpass API response elements into place objects.
 */
function parseElements(elements, category, userLat, userLng) {
  const cat = CATEGORIES[category]
  const isHosp = cat.isHospital === true

  return elements
    .map((e) => {
      let eLat, eLng

      if (e.lat != null && e.lon != null) {
        eLat = Number(e.lat)
        eLng = Number(e.lon)
      } else if (e.center) {
        eLat = Number(e.center.lat)
        eLng = Number(e.center.lon)
      }

      if (!eLat || !eLng || !isFinite(eLat) || !isFinite(eLng)) return null
      if (!e.tags) return null

      const tags = e.tags
      const name = tags.name || tags.amenity || 'Unknown'

      // Client-side specialty filter for hospitals
      if (isHosp) {
        const n = name.toLowerCase()
        if (SPECIALTY_FILTER_WORDS.some((w) => n.includes(w))) return null
      }

      // Extract phone from OSM tags
      const osmPhone =
        tags.phone ||
        tags['contact:phone'] ||
        tags['contact:mobile'] ||
        tags['phone:emergency'] ||
        tags['emergency:phone'] ||
        tags['contact:emergency'] ||
        ''

      const fallbackPhone = cat.emergencyNum
      const phone = osmPhone || fallbackPhone

      return {
        name,
        lat: eLat,
        lng: eLng,
        phone,
        hasOsmPhone: !!osmPhone,
        distance: haversine(userLat, userLng, eLat, eLng),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 50)
}

/**
 * Search nearby places using Overpass API with fallback.
 */
export async function searchNearby(category, lat, lng, radiusKm) {
  const query = buildOverpassQuery(category, lat, lng, radiusKm)
  const reqHeaders = {
    'User-Agent': 'RoadSOS/1.0 (Emergency navigation app)',
  }

  const params = new URLSearchParams({ data: query })

  let response = await fetch(`${OVERPASS_PRIMARY}?${params}`, {
    headers: reqHeaders,
  })

  // Fallback to backup server if rate-limited or server-side error (e.g. 504 Gateway Timeout)
  if (response.status === 406 || response.status === 429 || response.status >= 500) {
    response = await fetch(`${OVERPASS_BACKUP}?${params}`, {
      headers: reqHeaders,
    })
  }

  if (!response.ok) {
    throw new Error(`Overpass error: ${response.status}`)
  }

  const data = await response.json()
  const elements = data.elements || []

  return parseElements(elements, category, lat, lng)
}
