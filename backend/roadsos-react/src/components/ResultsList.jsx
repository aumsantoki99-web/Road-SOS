import { X, MapPin, Phone, ChevronRight } from 'lucide-react'
import { distLabel } from '../utils/haversine'
import CATEGORIES from '../constants/categories'

export default function ResultsList({ places, selectedCategory, onSelect, onClose }) {
  const cat = CATEGORIES[selectedCategory]
  const color = cat?.color || '#EF4444'
  const IconComponent = cat?.icon

  return (
    <div className="fixed inset-0 z-[1800] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg rounded-t-[24px] animate-slide-up flex flex-col"
        style={{ background: '#111827', maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 pb-3">
          {IconComponent && (
            <IconComponent className="w-5 h-5 mr-2.5" style={{ color }} />
          )}
          <h2 className="text-white font-bold text-base flex-1">
            {places.length} {cat?.label || 'Results'} Found
          </h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close results"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-white/8" />

        {/* List */}
        <div className="overflow-y-auto flex-1 pb-6">
          {places.map((place, idx) => (
            <button
              key={`${place.lat}_${place.lng}_${idx}`}
              onClick={() => onSelect(place)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
            >
              {/* Index badge */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}
              >
                <span className="text-sm font-bold" style={{ color }}>
                  {idx + 1}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {place.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color }} />
                  <span className="text-xs font-bold" style={{ color }}>
                    {distLabel(place.distance)}
                  </span>
                  {place.phone && (
                    <>
                      <span className="text-white/15 mx-1">·</span>
                      <Phone className="w-3 h-3 text-white/30 flex-shrink-0" />
                      <span className="text-white/40 text-[11px] truncate">
                        {place.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
