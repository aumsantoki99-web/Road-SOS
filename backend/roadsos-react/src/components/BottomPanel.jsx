import { Loader2, ListOrdered, Siren, WifiOff, Accessibility } from 'lucide-react'
import CategoryPills from './CategoryPills'
import CATEGORIES from '../constants/categories'

export default function BottomPanel({
  selectedCategory,
  onCategoryChange,
  radiusKm,
  onRadiusChange,
  isSearching,
  isRoutingSearch,
  isOffline,
  nearbyPlaces,
  onSearch,
  onShowResults,
  onFindNearestByRoad,
  onTriageOpen,
  panelOffset,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const cat = CATEGORIES[selectedCategory]
  const color = cat?.color || '#EF4444'
  const IconComponent = cat?.icon

  const handleTouchStart = (e) => {
    onDragStart?.(e.touches[0].clientY)
  }
  const handleTouchMove = (e) => {
    onDragMove?.(e.touches[0].clientY)
  }
  const handleTouchEnd = () => {
    onDragEnd?.()
  }
  const handleMouseDown = (e) => {
    onDragStart?.(e.clientY)
  }

  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-[1000] transition-transform duration-300 ease-out"
      style={{
        transform: `translateY(${-panelOffset}px)`,
      }}
    >
      <div
        className="rounded-t-[24px] border-t shadow-2xl"
        style={{
          background: 'rgba(10, 14, 26, 0.96)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 -5px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3.5 pb-3 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-6 bottom-panel-inner">
          {/* Category Pills */}
          <CategoryPills selected={selectedCategory} onSelect={onCategoryChange} />

          {/* Radius Control */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/40 text-xs tracking-wider font-medium">
                Search Radius
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ color, background: `${color}18` }}
              >
                {radiusKm.toFixed(1)} km
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={radiusKm}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
              className="w-full mt-1"
              style={{
                accentColor: color,
                '--thumb-color': color,
              }}
              id="radius-slider"
            />
            <style>{`
              #radius-slider::-webkit-slider-thumb { background: ${color}; }
              #radius-slider::-moz-range-thumb { background: ${color}; }
              #radius-slider::-webkit-slider-runnable-track {
                background: linear-gradient(to right, ${color} 0%, ${color} ${((radiusKm - 0.5) / 19.5) * 100}%, rgba(255,255,255,0.08) ${((radiusKm - 0.5) / 19.5) * 100}%, rgba(255,255,255,0.08) 100%);
              }
            `}</style>
          </div>

          {/* Offline Banner */}
          {isOffline && (
            <div
              className="w-full mt-3 px-3.5 py-2 rounded-[10px] border flex items-center gap-2"
              style={{
                background: '#B4530915',
                borderColor: '#B45309',
              }}
            >
              <WifiOff className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <span className="text-[#F59E0B] text-[11px] font-semibold">
                📵 Offline Mode — using local emergency data
              </span>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={isSearching}
            className="btn w-full mt-3 py-3.5 rounded-[14px] text-sm font-bold"
            style={{
              background: isSearching ? `${color}66` : color,
            }}
            id="search-button"
          >
            {isSearching ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              IconComponent && <IconComponent className="w-[18px] h-[18px]" />
            )}
            {isSearching
              ? 'Searching...'
              : isOffline
                ? `📦 Search (Offline) ${cat?.label}`
                : `Search ${cat?.label} in ${radiusKm.toFixed(1)} km`}
          </button>

          {/* Triage Button (trauma only) */}
          {selectedCategory === 'trauma' && (
            <button
              onClick={onTriageOpen}
              className="btn w-full mt-3 py-3.5 rounded-[14px] text-sm font-bold border"
              style={{
                background: '#111827',
                borderColor: '#EF4444',
                color: '#EF4444',
              }}
              id="triage-button"
            >
              <Accessibility className="w-[18px] h-[18px]" />
              🎯 Triage Smart Search
            </button>
          )}

          {/* Results actions */}
          {nearbyPlaces.length > 0 && (
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={onShowResults}
                className="flex-1 h-[42px] rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: `${color}55`, color }}
                id="results-list-button"
              >
                <ListOrdered className="w-4 h-4" />
                List ({nearbyPlaces.length})
              </button>
              <button
                onClick={onFindNearestByRoad}
                disabled={isRoutingSearch}
                className="btn flex-1 h-[42px] rounded-xl text-xs font-bold"
                style={{
                  background: isRoutingSearch ? '#7C3AED66' : '#7C3AED',
                }}
                id="nearest-road-button"
              >
                {isRoutingSearch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Siren className="w-4 h-4" />
                )}
                {isRoutingSearch ? 'Routing...' : 'Nearest Road'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
