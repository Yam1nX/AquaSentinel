import { useEffect, useState } from 'react'
import { api } from '../api'

const RISK_COLOR = { Low: '#5B8C72', Medium: '#E8A33D', High: '#C1443C' }
const STATE_COLOR = { NORMAL: '#5B8C72', WATCH: '#E8A33D', WARNING: '#E8A33D', CRITICAL: '#C1443C' }

const STATE_FILTERS = ['ALL', 'CRITICAL', 'WARNING', 'WATCH', 'NORMAL']

export default function PriorityPanel({ onSelectStation }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [stateFilter, setStateFilter] = useState('CRITICAL')

  useEffect(() => {
    const params = { limit: 25 }
    if (stateFilter !== 'ALL') params.state = stateFilter
    api.priority(params).then(setData).catch((e) => setError(e.message))
  }, [stateFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STATE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStateFilter(f)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
              stateFilter === f
                ? 'bg-amber-500 border-amber-500 text-ink-950'
                : 'border-ink-700 text-paper/60 hover:border-amber-500/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="text-coral-400 text-sm font-mono">{error}</div>}
      {!data && !error && <div className="text-paper/40 font-mono text-sm">loading inspection priority…</div>}

      {data && (
        <>
          <div className="border border-ink-700 rounded p-3 text-[11px] text-paper/40 leading-relaxed">
            {data.methodology}
          </div>

          <div className="text-paper/40 text-xs font-mono">
            showing {data.returned} of {data.total_stations_ranked.toLocaleString()} ranked stations
          </div>

          <div className="space-y-1.5">
            {data.stations.map((s, i) => (
              <button
                key={s.site_id}
                onClick={() => onSelectStation && onSelectStation(s.site_id)}
                className="w-full text-left border border-ink-700 hover:border-amber-500/50 rounded p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-paper/30 font-mono text-xs w-5 shrink-0">#{i + 1}</span>
                    <span className="text-paper/90 text-sm truncate">{s.monitoringSiteName}</span>
                    <span className="text-paper/40 text-xs font-mono shrink-0">({s.countryCode})</span>
                  </div>
                  <span className="font-mono text-xs text-paper/50 shrink-0">score {s.priority_score}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-mono">
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: `${RISK_COLOR[s.current_risk_level]}22`, color: RISK_COLOR[s.current_risk_level] }}
                  >
                    current: {s.current_risk_level}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: `${STATE_COLOR[s.early_warning_state]}22`, color: STATE_COLOR[s.early_warning_state] }}
                  >
                    {s.early_warning_state}
                  </span>
                  {s.forecast_next_year_risk_level && (
                    <span className="px-1.5 py-0.5 rounded bg-ink-950 text-paper/50">
                      next year (forecast): {s.forecast_next_year_risk_level}
                      {s.forecast_shows_escalation ? ' ↑' : ''}
                    </span>
                  )}
                  <span className="text-paper/30">last measured {s.last_recorded_year}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
