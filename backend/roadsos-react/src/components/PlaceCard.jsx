import { Navigation, Phone, X, MapPin } from 'lucide-react'
import { distLabel } from '../utils/haversine'
import CATEGORIES from '../constants/categories'

export default function PlaceCard({ place, selectedCategory, onClose, onNavigate, onCall }) {
  const cat = CATEGORIES[selectedCategory]
  const color = cat?.color || '#EF4444'
  const IconComponent = cat?.icon

  return (
    <div
      className="animate-fade-in-up rounded-[18px] p-4 border shadow-2xl"
      style={{
        background: '#111827',
        borderColor: `${color}55`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <div
          className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22` }}
        >
          {IconComponent && <IconComponent className="w-5 h-5" style={{ color }} />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-[15px] truncate">{place.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color }} />
            <span className="text-xs font-bold" style={{ color }}>
              {distLabel(place.distance)}
            </span>
            {place.phone && (
              <>
                <span className="text-white/20 mx-1.5">|</span>
                <Phone className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="text-white/50 text-[11px] truncate">{place.phone}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors p-0.5"
          aria-label="Close place card"
        >
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Phone Type Badge */}
      <div className="flex items-center gap-2 mt-3 mb-3">
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-md border"
          style={{
            color: place.hasOsmPhone ? '#059669' : '#F59E0B',
            background: place.hasOsmPhone ? '#05966915' : '#F59E0B15',
            borderColor: place.hasOsmPhone ? '#05966944' : '#F59E0B44',
          }}
        >
          {place.hasOsmPhone ? '📞 Direct' : '🆘 Emergency'}
        </span>
        <span className="text-white font-bold text-sm">{place.phone}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={() => onNavigate?.(place.lat, place.lng)}
          className="btn flex-1 py-2.5 rounded-[10px] text-sm"
          style={{ background: '#1D4ED8' }}
          id="navigate-button"
        >
          <Navigation className="w-4 h-4" />
          Navigate
        </button>
        <button
          onClick={() => onCall?.(place.phone)}
          className="btn flex-1 py-2.5 rounded-[10px] text-sm"
          style={{ background: '#059669' }}
          id="call-button"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </button>
      </div>
    </div>
  )
}
