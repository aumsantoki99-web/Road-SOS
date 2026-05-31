import { Crosshair, Loader2, HeartPulse } from 'lucide-react'

export default function TopHud({ position, isLoading, onOpenProfile }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[1000]">
      <div className="safe-area-padding flex items-center justify-between px-4 pt-3 sm:px-6">
        {/* Logo */}
        <div className="glass rounded-[14px] px-3 py-2 flex items-center gap-1.5">
          <svg
            className="w-[18px] h-[18px] text-[#3B82F6]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="currentColor"
              stroke="none"
              fontSize="10"
              fontWeight="900"
            >
              SOS
            </text>
          </svg>
          <span className="text-white font-bold text-sm tracking-tight">
            RoadSOS
          </span>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Medical ID Profile Button */}
          <button
            onClick={onOpenProfile}
            className="glass rounded-[14px] p-2 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-red-500 border border-red-500/20"
            style={{ minHeight: '38px', minWidth: '38px' }}
            id="profile-button"
            aria-label="Open Medical ID"
          >
            <HeartPulse className="w-4 h-4 text-red-500 animate-pulse" />
          </button>

          {/* GPS Coordinates */}
          <div className="glass rounded-[14px] px-2.5 py-2 flex items-center gap-1.5" style={{ height: '38px' }}>
          {position ? (
            <>
              <Crosshair className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-white text-[11px] font-mono">
                {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
              </span>
            </>
          ) : (
            <>
              {isLoading && (
                <Loader2 className="w-3 h-3 text-[#3B82F6] animate-spin" />
              )}
              <span className="text-white/70 text-xs">Getting GPS...</span>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
