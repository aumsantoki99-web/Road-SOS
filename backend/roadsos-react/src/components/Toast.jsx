import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function Toast({ message, bgColor, visible, onDismiss }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(() => onDismiss?.(), 300)
      }, 4000)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [visible, message, onDismiss])

  if (!visible && !show) return null

  return (
    <div className="fixed top-0 left-4 right-4 z-[1500] pt-[env(safe-area-inset-top,8px)]">
      <div
        className={`mt-2 px-4 py-3.5 rounded-[18px] border border-white/15 shadow-xl
                    flex items-center gap-3 transition-all duration-300 
                    ${show ? 'animate-fade-in-down opacity-100' : 'opacity-0 -translate-y-3'}`}
        style={{
          background: `${bgColor || '#000'}ee`,
          boxShadow: `0 4px 24px ${bgColor || '#000'}66`,
        }}
      >
        <span className="flex-1 text-white text-[13px] font-semibold leading-tight">
          {message}
        </span>
        <button
          onClick={() => {
            setShow(false)
            setTimeout(() => onDismiss?.(), 200)
          }}
          className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
