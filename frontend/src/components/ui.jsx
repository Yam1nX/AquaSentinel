import React, { useEffect, useRef, useState } from 'react'

const PATHS = {
  overview: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  assess: 'M4 19V9m5 10V5m5 14v-7m5 7V3',
  map: 'M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14m6-12v14',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM8.5 12l2.5 2.5L16 9',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4A2 2 0 0019 18l-5-9V3M8 15h8',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM6 19h13v2H6',
  droplet: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  alert: 'M12 4l9 16H3L12 4zM12 10v4m0 3h.01',
  arrow: 'M5 12h14m-6-6l6 6-6 6',
  check: 'M5 12l4 4 10-10',
  x: 'M6 6l12 12M18 6L6 18',
  help: 'M9.5 9a2.5 2.5 0 115 0c0 2-2.5 2-2.5 4M12 17h.01',
}

export function Icon({ name, className = 'w-4 h-4', stroke = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] || PATHS.droplet} />
    </svg>
  )
}

export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  const raf = useRef()
  useEffect(() => {
    if (target == null || Number.isNaN(target)) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setV(target); return }
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return v
}

export function Stat({ label, value, suffix = '', decimals = 0, tone = 'paper', hint, format }) {
  const v = useCountUp(typeof value === 'number' ? value : null)
  const color = { paper: 'text-paper', coral: 'text-coral-400', amber: 'text-amber-400', sage: 'text-sage-400', sky: 'text-sky-300' }[tone]
  const shown = typeof value === 'number' ? (format ? format(v) : v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })) : (value ?? '-')
  return (
    <div className="card p-4 md:p-5 card-hover">
      <div className="eyebrow mb-2">{label}</div>
      <div className={`font-display text-3xl md:text-4xl leading-none ${color}`}>{shown}<span className="text-lg text-paper/40 ml-0.5">{suffix}</span></div>
      {hint && <div className="text-paper/45 text-xs mt-2 leading-relaxed">{hint}</div>}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-2xl md:text-3xl text-paper tracking-tight">{title}</h2>
        {sub && <p className="text-paper/50 text-sm mt-1.5 max-w-2xl leading-relaxed">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Pill({ children, tone = 'ink', className = '' }) {
  const t = {
    ink: 'border-ink-700 text-paper/60', sky: 'border-sky-500/40 text-sky-300 bg-sky-500/10', coral: 'border-coral-500/40 text-coral-400 bg-coral-500/10',
    amber: 'border-amber-500/40 text-amber-400 bg-amber-500/10', sage: 'border-sage-500/40 text-sage-400 bg-sage-500/10',
  }[tone]
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-mono ${t} ${className}`}>{children}</span>
}

export function Loading({ text = 'loading…' }) {
  return <div className="text-paper/40 font-mono text-sm py-8 text-center"><span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse-ring mr-2 align-middle" />{text}</div>
}

export const pct = (x, d = 1) => (x == null ? '-' : `${(x * 100).toFixed(d)}%`)
