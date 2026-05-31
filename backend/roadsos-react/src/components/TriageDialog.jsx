import { useState } from 'react'
import { Crosshair, Building2 } from 'lucide-react'

/**
 * Triage Smart Search dialog.
 * User clicks on a body region to determine the specialist type needed.
 * In React, we use a simplified SVG body outline instead of a 3D model.
 */
export default function TriageDialog({ onSearch, onClose }) {
  const [selectedRegion, setSelectedRegion] = useState(null)

  const regions = [
    { id: 'head', label: 'Neurology', search: 'Neurology Hospital', y1: 0, y2: 20 },
    { id: 'chest', label: 'Cardiac/Pulmonary', search: 'Cardiac Hospital', y1: 20, y2: 45 },
    { id: 'abdomen', label: 'Trauma/Internal', search: 'Trauma Center', y1: 45, y2: 65 },
    { id: 'legs', label: 'Orthopedic', search: 'Orthopedic Hospital', y1: 65, y2: 100 },
  ]

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percentY = ((e.clientY - rect.top) / rect.height) * 100
    const region = regions.find((r) => percentY >= r.y1 && percentY < r.y2)
    if (region) setSelectedRegion(region)
  }

  return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm rounded-[20px] p-5 border animate-fade-in-up"
        style={{
          background: '#0A0E1A',
          borderColor: '#1E3A8A',
          borderWidth: '1.5px',
        }}
      >
        <h2 className="text-white text-xl font-bold text-center">
          Triage Smart Search
        </h2>
        <p className="text-white/60 text-[13px] text-center mt-2">
          Click on the body region where the injury occurred
        </p>

        {/* Body SVG */}
        <div
          className="mt-5 mx-auto rounded-2xl border cursor-crosshair relative overflow-hidden"
          style={{
            width: '250px',
            height: '380px',
            background: 'rgba(0,0,0,0.2)',
            borderColor: 'rgba(0,255,255,0.2)',
          }}
          onClick={handleClick}
        >
          <svg
            viewBox="0 0 200 380"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body outline */}
            {/* Head */}
            <ellipse cx="100" cy="35" rx="25" ry="30"
              stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" fill="rgba(59,130,246,0.06)" />
            {/* Neck */}
            <rect x="90" y="64" width="20" height="15"
              stroke="rgba(59,130,246,0.3)" strokeWidth="1" fill="rgba(59,130,246,0.04)" rx="4" />
            {/* Torso */}
            <path d="M60 79 L140 79 L135 170 L65 170 Z"
              stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" fill="rgba(59,130,246,0.06)" />
            {/* Left arm */}
            <path d="M60 82 L30 130 L25 180 L35 180 L45 135 L60 100"
              stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" fill="none" />
            {/* Right arm */}
            <path d="M140 82 L170 130 L175 180 L165 180 L155 135 L140 100"
              stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" fill="none" />
            {/* Pelvis */}
            <path d="M65 170 L135 170 L130 200 L70 200 Z"
              stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" fill="rgba(59,130,246,0.04)" />
            {/* Left leg */}
            <path d="M70 200 L65 300 L55 370 L75 370 L80 300 L90 200"
              stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" fill="rgba(59,130,246,0.04)" />
            {/* Right leg */}
            <path d="M110 200 L120 300 L125 370 L145 370 L135 300 L130 200"
              stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" fill="rgba(59,130,246,0.04)" />

            {/* Region labels */}
            <text x="100" y="38" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter">HEAD</text>
            <text x="100" y="125" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter">CHEST</text>
            <text x="100" y="185" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter">ABDOMEN</text>
            <text x="100" y="310" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter">LEGS</text>

            {/* Region lines */}
            <line x1="20" y1="76" x2="180" y2="76" stroke="rgba(0,255,255,0.15)" strokeDasharray="4 4" />
            <line x1="20" y1="171" x2="180" y2="171" stroke="rgba(0,255,255,0.15)" strokeDasharray="4 4" />
            <line x1="20" y1="247" x2="180" y2="247" stroke="rgba(0,255,255,0.15)" strokeDasharray="4 4" />
          </svg>

          {/* Selected indicator */}
          {selectedRegion && (
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: `${(selectedRegion.y1 + selectedRegion.y2) / 2}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Crosshair className="w-8 h-8 text-red-400 animate-pulse drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Selected region action */}
        {selectedRegion && (
          <div className="mt-4 animate-fade-in-up">
            <button
              onClick={() => {
                onSearch(selectedRegion.search)
                onClose()
              }}
              className="btn w-full py-3 rounded-[10px] text-sm font-bold"
              style={{ background: '#DC2626' }}
              id="triage-search-button"
            >
              <Building2 className="w-4 h-4" />
              Search {selectedRegion.label}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
