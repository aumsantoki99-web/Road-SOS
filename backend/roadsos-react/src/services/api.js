/**
 * API service for communicating with the RoadSOS backend.
 * All endpoints are placeholders — ready for backend integration.
 */

// Use 10.0.2.2 instead of localhost so the Android emulator can reach the Windows host machine
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://10.0.2.2:5000'

const headers = {
  'Content-Type': 'application/json',
}

/**
 * Trigger an SOS emergency call via the backend.
 */
export async function triggerSosCall(lat, lng, category, profile = null) {
  const bodyData = { lat, lng, category }
  if (profile) {
    bodyData.name = profile.name
    bodyData.age = profile.age
    bodyData.bloodGroup = profile.bloodGroup
    bodyData.conditions = profile.conditions
    bodyData.phone = profile.phone
    bodyData.gender = profile.gender
  }

  const response = await fetch(`${SERVER_URL}/trigger-call`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
  })

  if (!response.ok) {
    throw new Error(`Server Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Update live location for an active SOS call session.
 */
export async function updateLocation(callSid, lat, lng) {
  const response = await fetch(`${SERVER_URL}/update-location`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ call_sid: callSid, lat, lng }),
  })

  if (!response.ok) {
    throw new Error(`Location update failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Get debug session info (dev only).
 */
export async function getDebugSessions() {
  const response = await fetch(`${SERVER_URL}/debug-sessions`, { headers })
  return response.json()
}
