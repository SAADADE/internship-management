import clsx from 'clsx'

const colorMap = {
  green:  { bg: 'bg-primary-50',   icon: 'bg-primary-100 text-primary-700',  value: 'text-primary-800' },
  blue:   { bg: 'bg-sky-50',       icon: 'bg-sky-100 text-sky-700',          value: 'text-sky-800' },
  amber:  { bg: 'bg-amber-50',     icon: 'bg-amber-100 text-amber-700',      value: 'text-amber-800' },
  red:    { bg: 'bg-red-50',       icon: 'bg-red-100 text-red-700',          value: 'text-red-800' },
  purple: { bg: 'bg-purple-50',    icon: 'bg-purple-100 text-purple-700',    value: 'text-purple-800' },
}

export default function StatsCard({ icon: Icon, label, value, color = 'green', trend, trendLabel }) {
  const colors = colorMap[color] || colorMap.green
  return (
    <div className={clsx('card-hover p-5', colors.bg)}>
      <div className="flex items-start justify-between">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={clsx(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={clsx('text-2xl font-bold font-heading', colors.value)}>{value}</p>
        <p className="text-sm text-gray-500 font-body mt-0.5">{label}</p>
        {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
      </div>
    </div>
  )
}
