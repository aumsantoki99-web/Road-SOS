import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { distLabel } from '../utils/haversine'

// Fix Leaflet default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/** Custom colored marker icon */
function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#fff"/>
    </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
    className: '',
  })
}

const userIcon = createColoredIcon('#3B82F6')

/** Component to fly to a specific position on the map */
function FlyToPosition({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 14, { duration: 1.2 })
    }
  }, [map, position, zoom])
  return null
}

export default function MapView({
  position,
  places,
  selectedPlace,
  radiusKm,
  categoryColor,
  flyTo,
  flyToZoom,
  onPlaceSelect,
  onMapClick,
}) {
  const mapRef = useRef(null)
  const defaultCenter = [23.0225, 72.5714]

  const center = position
    ? [position.latitude, position.longitude]
    : defaultCenter

  const placeIcon = createColoredIcon(categoryColor || '#EF4444')

  return (
    <MapContainer
      center={center}
      zoom={position ? 14 : 5}
      className="h-full w-full"
      ref={mapRef}
      zoomControl={false}
      attributionControl={true}
      whenCreated={(map) => {
        map.on('click', () => onMapClick?.())
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Fly to position when it changes */}
      {flyTo && <FlyToPosition position={flyTo} zoom={flyToZoom} />}

      {/* User marker */}
      {position && (
        <Marker
          position={[position.latitude, position.longitude]}
          icon={userIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-center">
              <span className="font-bold">📍 You are here</span>
              <br />
              <span className="text-xs opacity-70">
                {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Radius circle */}
      {position && (
        <Circle
          center={[position.latitude, position.longitude]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: categoryColor || '#EF4444',
            fillColor: categoryColor || '#EF4444',
            fillOpacity: 0.08,
            weight: 2,
            opacity: 0.6,
          }}
        />
      )}

      {/* Place markers */}
      {places.map((place, idx) => (
        <Marker
          key={`${place.lat}_${place.lng}_${idx}`}
          position={[place.lat, place.lng]}
          icon={placeIcon}
          eventHandlers={{
            click: () => onPlaceSelect?.(place),
          }}
        >
          <Popup>
            <div>
              <div className="font-bold text-sm">{place.name}</div>
              <div className="text-xs mt-1 opacity-80">
                {distLabel(place.distance)}
              </div>
              {place.phone && (
                <div className="text-xs mt-1 opacity-60">📞 {place.phone}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
