export type StatTone = 'default' | 'brand' | 'emerald' | 'amber' | 'red'

const TONES: Record<StatTone, string> = {
  default: 'text-slate-900',
  brand: 'text-brand-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  red: 'text-red-700',
}

export interface StatData {
  label: string
  value: string
  unit?: string
  tone?: StatTone
  /** Span the full grid width on mobile so long amounts stay on one line. */
  fullWidth?: boolean
}

export function Stat({ label, value, unit, tone = 'default' }: StatData) {
  return (
    <div className="py-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${TONES[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
      </p>
    </div>
  )
}

export function MetricStrip({ metrics, cols = 4 }: { metrics: StatData[]; cols?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200/70 ${
        cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
      }`}
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`min-w-0 bg-white px-4 py-3 ${m.fullWidth ? 'col-span-2 lg:col-span-1' : ''}`}
        >
          <Stat {...m} />
        </div>
      ))}
    </div>
  )
}
