import CATEGORIES from '../constants/categories'

export default function CategoryPills({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {Object.entries(CATEGORIES).map(([key, cat]) => {
        const isSelected = selected === key
        const color = cat.color
        const IconComponent = cat.icon

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200 flex-shrink-0"
            style={{
              width: '78px',
              background: isSelected ? `${color}22` : '#111827',
              borderColor: isSelected ? color : 'rgba(255,255,255,0.08)',
              borderWidth: '1.5px',
            }}
            id={`category-${key}`}
          >
            <IconComponent
              className="w-5 h-5 transition-colors"
              style={{ color: isSelected ? color : 'rgba(255,255,255,0.38)' }}
            />
            <span
              className="text-[8.5px] font-semibold leading-tight text-center px-1 transition-colors"
              style={{ color: isSelected ? color : 'rgba(255,255,255,0.38)' }}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
