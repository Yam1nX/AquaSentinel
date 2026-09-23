import React, { useMemo, useState } from 'react'

export const COLORS = { coral: '#D9695F', amber: '#EAB35F', sage: '#7FA98C', sky: '#5FB6C9', paper: '#F5F1E7', muted: '#2a5a55' }

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-paper/55">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  )
}

/** 100% stacked horizontal bar. segments: [{label, value (0-1 share), color}] */
export function StackBar({ segments, height = 14, showLabels = true }) {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0) || 1
  return (
    <div>
      <div className="flex w-full overflow-hidden rounded-full bg-ink-800" style={{ height }} role="img" aria-label={segments.map((s) => `${s.label} ${(100 * s.value / total).toFixed(1)}%`).join(', ')}>
        {segments.map((s) => (
          <div key={s.label} title={`${s.label}: ${(100 * s.value / total).toFixed(1)}%`} style={{ width: `${(100 * (s.value || 0)) / total}%`, background: s.color, transition: 'width .8s ease' }} />
        ))}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 mt-1.5 text-[10.5px] font-mono text-paper/55">
          {segments.filter((s) => s.value > 0.004).map((s) => (
            <span key={s.label}><span style={{ color: s.color }}>●</span> {s.label} {(100 * s.value / total).toFixed(1)}%</span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Horizontal bar list. rows: [{label, value (0-1), right?, color?}] */
export function HBars({ rows, color = COLORS.sky, max = 1, labelWidth = 120 }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-[11.5px]">
          <div className="text-paper/70 truncate" style={{ width: labelWidth }} title={r.label}>{r.label}</div>
          <div className="flex-1 h-2.5 rounded-full bg-ink-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (100 * (r.value || 0)) / max)}%`, background: r.color || color, transition: 'width .8s ease' }} />
          </div>
          <div className="w-14 text-right font-mono text-paper/60">{r.right ?? `${(100 * (r.value || 0)).toFixed(0)}%`}</div>
        </div>
      ))}
    </div>
  )
}

function monthIndex(ym) { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1) }

/** Multi-series time chart. series: [{name, color, points:[{ym, y, lo?, hi?}]}] */
export function TimeChart({ series, height = 220, yLabel, refLine }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = height, P = { l: 44, r: 12, t: 12, b: 26 }
  const all = series.flatMap((s) => s.points)
  const geo = useMemo(() => {
    if (!all.length) return null
    const xs = all.map((p) => monthIndex(p.ym)); const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const ys = all.flatMap((p) => [p.y, p.lo ?? p.y, p.hi ?? p.y]).concat(refLine != null ? [refLine] : [])
    let y0 = Math.min(0, ...ys), y1 = Math.max(...ys); if (y1 === y0) y1 = y0 + 1
    y1 += (y1 - y0) * 0.06
    const sx = (v) => P.l + ((v - x0) / Math.max(1, x1 - x0)) * (W - P.l - P.r)
    const sy = (v) => H - P.b - ((v - y0) / (y1 - y0)) * (H - P.t - P.b)
    const yrs = []; for (let y = Math.ceil(x0 / 12); y <= Math.floor(x1 / 12); y++) yrs.push(y)
    return { x0, x1, y0, y1, sx, sy, yrs }
  }, [all.length, height, refLine])
  if (!geo) return <div className="text-paper/40 text-sm font-mono py-10 text-center">no data for this selection</div>
  const ticks = Array.from({ length: 5 }, (_, i) => geo.y0 + ((geo.y1 - geo.y0) * i) / 4)
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={geo.sy(t)} y2={geo.sy(t)} stroke="#1F4E49" strokeDasharray="2 4" />
            <text x={P.l - 6} y={geo.sy(t) + 3} textAnchor="end" fontSize="9.5" fill="#F5F1E799" fontFamily="IBM Plex Mono">{Math.abs(t) >= 100 ? t.toFixed(0) : t.toFixed(1)}</text>
          </g>
        ))}
        {geo.yrs.map((y) => (
          <text key={y} x={geo.sx(y * 12)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#F5F1E799" fontFamily="IBM Plex Mono">{y}</text>
        ))}
        {refLine != null && (
          <g><line x1={P.l} x2={W - P.r} y1={geo.sy(refLine)} y2={geo.sy(refLine)} stroke="#EAB35F" strokeDasharray="5 4" /><text x={W - P.r} y={geo.sy(refLine) - 4} textAnchor="end" fontSize="9.5" fill="#EAB35F" fontFamily="IBM Plex Mono">limit {refLine}</text></g>
        )}
        {series.map((s) => {
          const pts = [...s.points].sort((a, b) => monthIndex(a.ym) - monthIndex(b.ym))
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${geo.sx(monthIndex(p.ym)).toFixed(1)},${geo.sy(p.y).toFixed(1)}`).join(' ')
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="1.6" opacity=".85" />
              {pts.map((p) => (
                <circle key={p.ym} cx={geo.sx(monthIndex(p.ym))} cy={geo.sy(p.y)} r={hover?.ym === p.ym && hover?.s === s.name ? 4.5 : 2.4} fill={s.color}
                  onMouseEnter={() => setHover({ ...p, s: s.name, color: s.color })} />
              ))}
            </g>
          )
        })}
      </svg>
      {hover && (
        <div className="absolute top-1 right-2 card px-2.5 py-1.5 text-[11px] font-mono">
          <span style={{ color: hover.color }}>●</span> {hover.s} · {hover.ym} · <b>{hover.y}</b>{hover.n ? ` (n=${hover.n})` : ''}
        </div>
      )}
      {yLabel && <div className="text-[10px] font-mono text-paper/40 mt-1">{yLabel}</div>}
    </div>
  )
}
