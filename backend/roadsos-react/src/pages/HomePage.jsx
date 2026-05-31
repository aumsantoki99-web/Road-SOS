import { useState, useCallback, useRef, useEffect } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useConnectivity } from '../hooks/useConnectivity'
import { useSos } from '../hooks/useSos'
import { searchNearby } from '../services/overpass'
import { findNearestByRoad } from '../services/osrm'
import CATEGORIES from '../constants/categories'

import MapView from '../components/MapView'
import TopHud from '../components/TopHud'
import BottomPanel from '../components/BottomPanel'
import SosOverlay from '../components/SosOverlay'
import PlaceCard from '../components/PlaceCard'
import ResultsList from '../components/ResultsList'
import Toast from '../components/Toast'
import TriageDialog from '../components/TriageDialog'
import ProfileModal from '../components/ProfileModal'

import { Locate, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  // ── State ──
  const [selectedCategory, setSelectedCategory] = useState('trauma')
  const [radiusKm, setRadiusKm] = useState(3.0)
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isRoutingSearch, setIsRoutingSearch] = useState(false)
  const [showResultsList, setShowResultsList] = useState(false)
  const [showTriageDialog, setShowTriageDialog] = useState(false)

  // Profile / Medical ID state
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('roadsos_user_profile')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse user profile:', e)
      }
    }
    return null
  })
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isForceOnboarding, setIsForceOnboarding] = useState(false)

  // Onboarding check on first launch
  useEffect(() => {
    const setupDone = localStorage.getItem('roadsos_profile_setup_done')
    const saved = localStorage.getItem('roadsos_user_profile')
    let isProfileComplete = false
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // If phone or gender is missing, the profile is considered incomplete
        if (parsed && parsed.name && parsed.phone && parsed.gender) {
          isProfileComplete = true
        }
      } catch (e) {
        console.error('Failed to parse saved user profile:', e)
      }
    }

    if (!setupDone || !isProfileComplete) {
      // Clear incomplete/past profile to start fresh
      localStorage.removeItem('roadsos_user_profile')
      localStorage.removeItem('roadsos_profile_setup_done')
      setUserProfile(null)
      setIsForceOnboarding(true)
      setShowProfileModal(true)
    }
  }, [])

  // Map fly-to state
  const [flyTo, setFlyTo] = useState(null)
  const [flyToZoom, setFlyToZoom] = useState(14)

  // Toast state
  const [toast, setToast] = useState({ message: '', bgColor: '#000', visible: false })

  // Bottom panel drag state
  const [panelOffset, setPanelOffset] = useState(0)
  const dragStartY = useRef(null)
  const dragStartOffset = useRef(0)

  // ── Hooks ──
  const { position, isLoading } = useGeolocation()
  const { isOffline } = useConnectivity()

  const showToast = useCallback((message, bgColor) => {
    setToast({ message, bgColor, visible: true })
  }, [])

  const categoryLabel = CATEGORIES[selectedCategory]?.label || 'General Emergency'

  const { isSosActive, sosCountdown, triggerSos, cancelSos } = useSos(
    position,
    categoryLabel,
    showToast,
    userProfile
  )

  // ── Connectivity toasts ──
  const prevOffline = useRef(isOffline)
  useEffect(() => {
    if (isOffline !== prevOffline.current) {
      prevOffline.current = isOffline
      if (isOffline) {
        showToast('📵 Offline — showing local emergency data', '#B45309')
      } else {
        showToast('✅ Back online', '#059669')
      }
    }
  }, [isOffline, showToast])

  // ── Fly to user position when acquired ──
  useEffect(() => {
    if (position) {
      setFlyTo([position.latitude, position.longitude])
      setFlyToZoom(14)
    }
  }, [position])

  // ── Category change ──
  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory(cat)
    setSelectedPlace(null)
    setNearbyPlaces([])
  }, [])

  // ── Radius change ──
  const handleRadiusChange = useCallback((val) => {
    setRadiusKm(val)
    setNearbyPlaces([])
    setSelectedPlace(null)
  }, [])

  // ── Search ──
  const handleSearch = useCallback(async () => {
    if (!position) {
      showToast('📍 Still finding your location — wait 5 seconds', '#1D4ED8')
      return
    }

    setIsSearching(true)
    setNearbyPlaces([])
    setSelectedPlace(null)

    try {
      const results = await searchNearby(
        selectedCategory,
        position.latitude,
        position.longitude,
        radiusKm
      )

      setNearbyPlaces(results)

      if (results.length > 0) {
        setFlyTo([position.latitude, position.longitude])
        setFlyToZoom(radiusKm < 2 ? 15 : radiusKm < 5 ? 14 : 13)
        showToast(
          `✅ Found ${results.length} ${CATEGORIES[selectedCategory]?.label} nearby`,
          '#059669'
        )
      } else {
        showToast(
          `😕 No ${CATEGORIES[selectedCategory]?.label} found — try bigger radius`,
          '#B45309'
        )
      }
    } catch (err) {
      showToast(`❌ Network error: ${err.message}`, '#991B1B')
    } finally {
      setIsSearching(false)
    }
  }, [position, selectedCategory, radiusKm, showToast])

  // ── Find nearest by road ──
  const handleFindNearestByRoad = useCallback(async () => {
    if (nearbyPlaces.length === 0) {
      showToast('🔍 Search first to get results', '#1D4ED8')
      return
    }
    if (!position) return

    setIsRoutingSearch(true)
    showToast('🛣️ Calculating road distances...', '#7C3AED')

    try {
      const routed = await findNearestByRoad(
        nearbyPlaces,
        position.latitude,
        position.longitude
      )

      if (routed.length > 0) {
        const nearest = routed[0]
        setSelectedPlace(nearest)
        setFlyTo([nearest.lat, nearest.lng])
        setFlyToZoom(17)

        const roadKm = nearest.roadKm.toFixed(1)
        const etaText = nearest.etaMin > 0 ? ` · ~${nearest.etaMin} min drive` : ''
        showToast(
          `🚨 Nearest: ${nearest.name} • ${roadKm}km by road${etaText}`,
          '#059669'
        )
      } else {
        showToast('❌ Could not compute road distances', '#991B1B')
      }
    } catch (err) {
      showToast(`❌ Routing error: ${err.message}`, '#991B1B')
    } finally {
      setIsRoutingSearch(false)
    }
  }, [nearbyPlaces, position, showToast])

  // ── Place selection ──
  const handlePlaceSelect = useCallback((place) => {
    setSelectedPlace(place)
    setFlyTo([place.lat, place.lng])
    setFlyToZoom(17)
    setShowResultsList(false)
  }, [])

  // ── Navigate & Call ──
  const handleNavigate = useCallback((lat, lng) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      '_blank'
    )
  }, [])

  const handleCall = useCallback((phone) => {
    if (!phone) {
      showToast('No phone number available for this place.', '#991B1B')
      return
    }
    window.open(`tel:${phone}`, '_self')
  }, [showToast])

  // ── Triage search ──
  const handleTriageSearch = useCallback(
    (specialty) => {
      if (!position) return
      const { latitude, longitude } = position
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${specialty} near ${latitude},${longitude}`
        )}`,
        '_blank'
      )
    },
    [position]
  )

  // ── My Location button ──
  const handleMyLocation = useCallback(() => {
    if (position) {
      setFlyTo([position.latitude, position.longitude])
      setFlyToZoom(14)
    }
  }, [position])

  // ── Panel drag handlers ──
  const handleDragStart = useCallback(
    (clientY) => {
      dragStartY.current = clientY
      dragStartOffset.current = panelOffset
    },
    [panelOffset]
  )

  const handleDragMove = useCallback((clientY) => {
    if (dragStartY.current === null) return
    const delta = dragStartY.current - clientY
    let newOffset = dragStartOffset.current + delta
    newOffset = Math.max(-320, Math.min(0, newOffset))
    setPanelOffset(newOffset)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragStartY.current = null
    setPanelOffset((prev) => (prev < -150 ? -320 : 0))
  }, [])

  // Global mouse move/up for desktop drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragStartY.current !== null) {
        handleDragMove(e.clientY)
      }
    }
    const handleMouseUp = () => {
      if (dragStartY.current !== null) {
        handleDragEnd()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleDragMove, handleDragEnd])

  // ── Render ──
  const catColor = CATEGORIES[selectedCategory]?.color || '#EF4444'

  return (
    <div className="relative h-full w-full overflow-hidden" id="home-page">
      {/* Map */}
      <MapView
        position={position}
        places={nearbyPlaces}
        selectedPlace={selectedPlace}
        radiusKm={radiusKm}
        categoryColor={catColor}
        flyTo={flyTo}
        flyToZoom={flyToZoom}
        onPlaceSelect={handlePlaceSelect}
        onMapClick={() => setSelectedPlace(null)}
      />

      {/* Top HUD */}
      <TopHud
        position={position}
        isLoading={isLoading}
        onOpenProfile={() => {
          setIsForceOnboarding(false)
          setShowProfileModal(true)
        }}
      />

      {/* SOS Button */}
      {!isSosActive && (
        <div className="absolute top-20 left-0 right-0 z-[1000] flex justify-center">
          <button
            onClick={triggerSos}
            className="btn px-6 py-3.5 rounded-full text-lg font-bold tracking-wider animate-glow"
            style={{
              background: '#B91C1C',
              boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
            }}
            id="sos-button"
          >
            <AlertTriangle className="w-6 h-6" />
            EMERGENCY SOS
          </button>
        </div>
      )}

      {/* Bottom Panel */}
      <BottomPanel
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        radiusKm={radiusKm}
        onRadiusChange={handleRadiusChange}
        isSearching={isSearching}
        isRoutingSearch={isRoutingSearch}
        isOffline={isOffline}
        nearbyPlaces={nearbyPlaces}
        onSearch={handleSearch}
        onShowResults={() => setShowResultsList(true)}
        onFindNearestByRoad={handleFindNearestByRoad}
        onTriageOpen={() => setShowTriageDialog(true)}
        panelOffset={panelOffset}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      {/* My Location FAB */}
      <button
        onClick={handleMyLocation}
        className="absolute z-[1000] right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{
          bottom: selectedPlace ? '340px' : '295px',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        id="my-location-button"
        aria-label="Go to my location"
      >
        <Locate className="w-5 h-5 text-[#3B82F6]" />
      </button>

      {/* Selected Place Card */}
      {selectedPlace && (
        <div className="absolute left-4 right-4 z-[1000]" style={{ bottom: '270px' }}>
          <PlaceCard
            place={selectedPlace}
            selectedCategory={selectedCategory}
            onClose={() => setSelectedPlace(null)}
            onNavigate={handleNavigate}
            onCall={handleCall}
          />
        </div>
      )}

      {/* SOS Overlay */}
      {isSosActive && (
        <SosOverlay
          countdown={sosCountdown}
          onCancel={() => cancelSos(false)}
        />
      )}

      {/* Results List Modal */}
      {showResultsList && (
        <ResultsList
          places={nearbyPlaces}
          selectedCategory={selectedCategory}
          onSelect={handlePlaceSelect}
          onClose={() => setShowResultsList(false)}
        />
      )}

      {/* Triage Dialog */}
      {showTriageDialog && (
        <TriageDialog
          onSearch={handleTriageSearch}
          onClose={() => setShowTriageDialog(false)}
        />
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        bgColor={toast.bgColor}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />

      {/* Profile/Medical ID Modal */}
      {showProfileModal && (
        <ProfileModal
          isForceOnboarding={isForceOnboarding}
          onClose={(updatedProfile) => {
            if (updatedProfile) {
              setUserProfile(updatedProfile)
            }
            setShowProfileModal(false)
            setIsForceOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
