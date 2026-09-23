import React, { useEffect, useState } from 'react'
import { api } from '../api'
import EarlyWarningBadge from './EarlyWarningBadge'

const RISK_COLOR = { Low: '#5B8C72', Medium: '#E8A33D', High: '#C1443C' }

function Sparkline({ years }) {
  const w = 280
  const h = 60
  const pad = 6
  const pts = years.map((y) => y.risk_points)
  const max = Math.max(4, ...pts)
  const stepX = (w - pad * 2) / Math.max(1, years.length - 1)

  const coords = years.map((y, i) => {
    const x = pad + i * stepX
    const yy = h - pad - (y.risk_points / max) * (h - pad * 2)
    return [x, yy]
  })

  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <path d={path} fill="none" stroke="#EAB35F" strokeWidth="2" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={RISK_COLOR[years[i].risk_level] || '#888'} />
      ))}
    </svg>
  )
}

export default function StationTrendPanel({ siteId, onClose }) {
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)
    setForecast(null)
    api
      .stationHistory(siteId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    api.stationForecast(siteId).then(setForecast).catch(() => {})
  }, [siteId])

  if (loading) {
    return <div className="border border-ink-700 rounded p-5 text-paper/40 font-mono text-sm">loading station history…</div>
  }
  if (error) {
    return (
      <div className="border border-ink-700 rounded p-5 text-paper/50 text-sm">
        {error === 'No multi-year history available for this station.'
          ? 'This station has only a single recorded year — no real trend can be computed from it.'
          : error}
      </div>
    )
  }
  if (!data) return null

  const latest = data.years[data.years.length - 1]

  return (
    <div className="space-y-4">
      <div className="border border-ink-700 rounded p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-paper/40 text-xs font-mono mb-1">
              {data.countryCode} · real observed history · {data.n_years} years ({data.years[0].year}–{latest.year})
            </div>
            <h3 className="font-display text-xl text-paper">{data.monitoringSiteName || siteId}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-paper/30 hover:text-paper text-xs font-mono">
              ✕ close
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div>
            <div className="text-paper/40 text-xs font-mono mb-1">current risk</div>
            <div className="font-display text-2xl" style={{ color: RISK_COLOR[latest.risk_level] }}>
              {latest.risk_level}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-paper/40 text-xs font-mono mb-1">risk trajectory</div>
            <Sparkline years={data.years} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.risk_trajectory.map((r, i) => (
            <span
              key={i}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: `${RISK_COLOR[r]}22`, color: RISK_COLOR[r] }}
            >
              {data.years[i].year}: {r}
            </span>
          ))}
        </div>
      </div>

      <EarlyWarningBadge state={data.early_warning.state} reasons={data.early_warning.reasons} />

      <div className="border border-ink-700 rounded p-4">
        <div className="text-paper/40 text-xs font-mono mb-2">
          parameter change ({data.years[0].year} → {latest.year})
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(data.param_pct_change_first_to_last)
            .filter(([, v]) => v !== null)
            .map(([param, pct]) => (
              <div key={param} className="flex items-center justify-between font-mono">
                <span className="text-paper/60">{param}</span>
                <span className={pct > 0 ? 'text-coral-400' : 'text-sage-400'}>
                  {pct > 0 ? '+' : ''}
                  {pct}%
                </span>
              </div>
            ))}
        </div>
        <p className="text-paper/30 text-[11px] mt-3 border-t border-ink-700 pt-2">
          Real measured values from the EEA Waterbase dataset - not simulated.
        </p>
      </div>

      {forecast && (
        <div className="border border-amber-500/40 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-paper/40 text-xs font-mono">forecast - next year</div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              backtested, not a guarantee
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-paper/50 text-sm">{latest.risk_level}</span>
            <span className="text-paper/30">→</span>
            <span className="font-display text-xl" style={{ color: RISK_COLOR[forecast.forecast_next_year_risk_level] }}>
              {forecast.forecast_next_year_risk_level}
            </span>
            {forecast.forecast_shows_escalation && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-coral-500/15 text-coral-400 border border-coral-500/40">
                escalation expected
              </span>
            )}
          </div>

          <div className="space-y-1 mb-3">
            {Object.entries(forecast.forecast_confidence)
              .sort((a, b) => b[1] - a[1])
              .map(([cls, p]) => (
                <div key={cls} className="flex items-center gap-2">
                  <span className="w-14 text-xs font-mono text-paper/60">{cls}</span>
                  <div className="flex-1 h-1.5 bg-ink-950 rounded overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${p * 100}%`, background: RISK_COLOR[cls] }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-mono text-paper/50">{Math.round(p * 100)}%</span>
                </div>
              ))}
          </div>

          {forecast.backtest && (
            <div className="text-[11px] text-paper/40 leading-relaxed border-t border-ink-700 pt-2 space-y-1">
              <div>
                Backtested on 2023-2024 (never trained on): {Math.round(forecast.backtest.forecast_model.accuracy * 100)}%
                accuracy vs. {Math.round(forecast.backtest.persistence_baseline.accuracy * 100)}% for a "nothing changes" baseline.
              </div>
              <div>
                Of stations that actually worsen year-over-year (~{Math.round(forecast.backtest.worsening_base_rate * 100)}%
                of cases), this model catches ~{Math.round(forecast.backtest.worsening_transition_recall * 100)}% of them.
              </div>
              <div className="text-paper/30">{forecast.backtest.caveat}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
