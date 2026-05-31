import { TriangleAlert } from 'lucide-react'

export default function SosOverlay({ countdown, onCancel }) {
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center animate-fade-in-up"
         style={{ background: 'rgba(127, 29, 29, 0.92)' }}>
      {/* Pulsing ring behind icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-500/30 animate-pulse-ring" 
             style={{ margin: '-12px' }} />
        <TriangleAlert className="w-20 h-20 text-white drop-shadow-xl" strokeWidth={1.5} />
      </div>

      <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-wide mb-2">
        CALLING FOR HELP IN
      </h1>

      <div className="text-white text-[100px] sm:text-[120px] font-black leading-none animate-countdown drop-shadow-2xl">
        {countdown}
      </div>

      <div className="mt-10">
        <button
          onClick={onCancel}
          className="btn px-10 py-5 text-xl font-bold rounded-full animate-glow"
          style={{ background: '#16A34A' }}
          id="cancel-sos-button"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          I AM SAFE (CANCEL)
        </button>
      </div>

      <p className="text-white/50 text-sm mt-8 animate-pulse">
        Swipe or tap CANCEL to abort emergency call
      </p>
    </div>
  )
}
