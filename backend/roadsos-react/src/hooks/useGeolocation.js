import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for browser geolocation.
 * Mirrors Flutter's Geolocator usage.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const getCurrentPosition = useCallback(() => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setIsLoading(false)
      },
      (err) => {
        setError(err.message)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    getCurrentPosition()
  }, [getCurrentPosition])

  // Watch position for live updates
  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      () => {}, // silently ignore watch errors
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { position, isLoading, error, refresh: getCurrentPosition }
}
