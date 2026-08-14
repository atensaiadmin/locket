import type { HealthPoint } from '../api'

// A tiny inline SVG sparkline of health history (green up / red down).
export function Sparkline({ points }: { points: HealthPoint[] }) {
  if (points.length < 2) {
    return <span className="text-xs text-slate-400">–</span>
  }
  const w = 80
  const h = 24
  const step = w / (points.length - 1)
  const y = (p: HealthPoint) => (p.healthy ? 6 : h - 6)

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(p)}`)
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
