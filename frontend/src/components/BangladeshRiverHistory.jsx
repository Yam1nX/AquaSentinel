import React, { useEffect, useState } from 'react'
import { api } from '../api'
import EarlyWarningBadge from './EarlyWarningBadge'

const RISK_COLOR = { Low: '#5B8C72', Medium: '#E8A33D', High: '#C1443C' }
const RIVERS = [
  { key: 'buriganga', label: 'Buriganga' },
  { key: 'turag', label: 'Turag' },
  { key: 'shitalakhya', label: 'Shitalakhya' },
]

function DualTrajectory({ years, riskTrajectory, modelTrajectory }) {
  const w = 320
  const h = 90
  const pad = 10
  const stepX = (w - pad * 2) / Math.max(1, years.length - 1)
  const rowY = { rule: pad + 8, model: h - pad - 8 }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      {/* connecting line per row, with a visual break across the 2016-2020 gap */}
      {years.map((y, i) => {
        if (i === 0) return null
        const gap = y.year - years[i - 1].year > 1
        const x1 = pad + (i - 1) * stepX
        const x2 = pad + i * stepX
        return (
          <g key={i}>
            <line x1={x1} y1={rowY.rule} x2={x2} y2={rowY.rule} stroke="#EAB35F" strokeWidth="1.5" strokeDasharray={gap ? '3,3' : '0'} opacity={gap ? 0.4 : 1} />
            <line x1={x1} y1={rowY.model} x2={x2} y2={rowY.model} stroke="#7a8a99" strokeWidth="1.5" strokeDasharray={gap ? '3,3' : '0'} opacity={gap ? 0.4 : 1} />
          </g>
        )
      })}
      {years.map((y, i) => {
        const x = pad + i * stepX
        return (
          <g key={i}>
            <circle cx={x} cy={rowY.rule} r="5" fill={RISK_COLOR[riskTrajectory[i]] || '#888'} />
            <circle cx={x} cy={rowY.model} r="4" fill={RISK_COLOR[modelTrajectory[i]] || '#888'} stroke="#0f1a15" strokeWidth="1" />
            <text x={x} y={h - 1} fontSize="8" textAnchor="middle" fill="#8a9691">{y.year}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function BangladeshRiverHistory({ onNoteClick }) {
  const [river, setRiver] = useState('buriganga')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    setError(null)
    api.bangladeshHistory(river).then(setData).catch((e) => setError(e.message))
  }, [river])

  const disagreements = data
    ? data.years.filter((y) => y.risk_level !== y.model_predicted_level).length
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-paper/40 text-xs font-mono">🇧🇩 real river-level history · Bangladesh DoE, 2010–2023</div>
        <div className="flex gap-1.5">
          {RIVERS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRiver(r.key)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                river === r.key ? 'border-amber-500 text-amber-400' : 'border-ink-700 text-paper/60 hover:border-amber-500/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-coral-400 text-sm font-mono">{error}</div>}
      {!data && !error && <div className="text-paper/40 font-mono text-sm">loading real river history…</div>}

      {data && (
        <>
          <div className="border border-ink-700 rounded p-5">
            <div className="text-paper/40 text-xs font-mono mb-3">
              {data.years.length} years measured (2016–2020: no DoE report available - honest gap, not bridged)
            </div>
            <DualTrajectory years={data.years} riskTrajectory={data.risk_trajectory} modelTrajectory={data.model_trajectory} />
            <div className="flex gap-4 mt-2 text-[11px] font-mono text-paper/50">
              <span>● top row: rule-based label (transparent threshold)</span>
              <span>● bottom row: EU-trained model's prediction</span>
            </div>
          </div>

          <div className="border border-coral-500/40 bg-coral-500/10 rounded p-4 text-sm text-coral-400 leading-relaxed">
            <div className="font-medium mb-1">
              ⚠ The model disagrees with the rule-based label in {disagreements}/{data.years.length} real years
            </div>
            Every single year, the transparent rule says the river is at least this severe - but the
            model, blind to Ammonium/Nitrate/Nitrite/Total phosphorus (never measured by DoE), predicts
            one class lower. This isn't a one-off: it's the same systematic under-call found on the
            single-point sites, now confirmed across {data.years.length} independent real yearly
            observations.
          </div>

          <EarlyWarningBadge state={data.early_warning.state} reasons={data.early_warning.reasons} />

          <div className="border border-ink-700 rounded p-4 text-[11px] text-paper/40 leading-relaxed">
            <span className="text-paper/60">Measured by DoE:</span> {data.measured_parameters.join(', ')} ·{' '}
            <span className="text-paper/60">Not measured (imputed):</span> {data.imputed_parameters.join(', ')}
            <br />
            Source: {data.source}
          </div>
        </>
      )}
    </div>
  )
}
