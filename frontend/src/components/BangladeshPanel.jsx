import React, { useEffect, useState } from 'react'
import { api } from '../api'
import DataCompleteness from './DataCompleteness'
import EarlyWarningBadge from './EarlyWarningBadge'
import BangladeshRiverHistory from './BangladeshRiverHistory'

const RISK_COLOR = { Low: '#5B8C72', Medium: '#E8A33D', High: '#C1443C' }

function DemoStepper({ siteKey }) {
  const [demo, setDemo] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const run = () => {
    setLoading(true)
    setError(null)
    setStep(0)
    api
      .bangladeshDemo(siteKey)
      .then(setDemo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  if (!demo) {
    return (
      <div className="border border-dashed border-amber-500/40 rounded p-4 text-center">
        <button
          onClick={run}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 font-medium rounded px-4 py-2 text-sm transition-colors"
        >
          {loading ? 'Running…' : '▶ Run Early-Warning Demo'}
        </button>
        <p className="text-paper/30 text-[11px] mt-2">
          Deterministic, reproducible 7-step walkthrough. Clearly labelled simulation.
        </p>
        {error && <p className="text-coral-400 text-xs mt-2 font-mono">{error}</p>}
      </div>
    )
  }

  const s = demo.steps[step]

  return (
    <div className="border border-amber-500/40 rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
          {demo.mode}
        </span>
        <button onClick={() => setDemo(null)} className="text-paper/30 hover:text-paper text-xs font-mono">
          ✕ reset
        </button>
      </div>

      <div className="flex items-center gap-1">
        {demo.steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex-1 h-1.5 rounded ${i <= step ? 'bg-amber-500' : 'bg-ink-700'}`}
          />
        ))}
      </div>

      <div>
        <div className="text-paper/40 text-xs font-mono mb-1">
          step {s.step}/7 {s.is_real_measurement && <span className="text-sage-400">· real measurement</span>}
        </div>
        <div className="font-display text-lg text-paper">{s.label}</div>
        <div className="font-display text-2xl mt-1" style={{ color: RISK_COLOR[s.prediction.risk_level] }}>
          {s.prediction.risk_level} risk
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono text-paper/60">
        {Object.entries(s.simulated_inputs).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span>{k}</span>
            <span className="text-paper/80">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep((v) => Math.max(0, v - 1))}
          disabled={step === 0}
          className="flex-1 border border-ink-700 rounded px-3 py-1.5 text-xs text-paper/70 disabled:opacity-30"
        >
          ← prev
        </button>
        <button
          onClick={() => setStep((v) => Math.min(demo.steps.length - 1, v + 1))}
          disabled={step === demo.steps.length - 1}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-ink-950 rounded px-3 py-1.5 text-xs font-medium"
        >
          next →
        </button>
      </div>

      {step === demo.steps.length - 1 && (
        <>
          <EarlyWarningBadge state={demo.early_warning.state} reasons={demo.early_warning.reasons} />
          <div className="text-xs text-paper/70">
            <div className="font-mono text-paper/40 mb-1">what next?</div>
            <ol className="list-decimal list-inside space-y-1">
              {demo.recommendations.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
        </>
      )}

      <p className="text-paper/30 text-[11px] border-t border-ink-700 pt-2">{demo.disclaimer}</p>
    </div>
  )
}

export default function BangladeshPanel() {
  const [sites, setSites] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState('buriganga-hazaribagh')

  useEffect(() => {
    api.bangladeshSites().then(setSites).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="text-coral-400 text-sm font-mono">{error}</div>
  if (!sites) return <div className="text-paper/40 font-mono text-sm">loading Bangladesh sites…</div>

  const site = sites.find((s) => s.site_key === selected)

  return (
    <div className="space-y-8">
      <BangladeshRiverHistory />

      <div className="border-t border-ink-700/60 pt-6">
        <div className="text-paper/40 text-xs font-mono mb-3">
          single-point field observations at specific pollution hotspots
        </div>
        <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sites.map((s) => (
          <button
            key={s.site_key}
            onClick={() => setSelected(s.site_key)}
            className={`text-xs font-mono border px-2.5 py-1 rounded transition-colors ${
              selected === s.site_key
                ? 'border-amber-500 text-amber-400'
                : 'border-ink-700 text-paper/60 hover:border-amber-500/50'
            }`}
          >
            {s.label.split(' — ')[0]}
          </button>
        ))}
      </div>

      {site && (
        <>
          <div className="border border-ink-700 rounded p-5">
            <div className="text-paper/40 text-xs font-mono mb-1">
              🇧🇩 real field observation · single point-in-time
            </div>
            <h3 className="font-display text-xl text-paper mb-3">{site.label}</h3>
            <div className="font-display text-4xl" style={{ color: RISK_COLOR[site.risk_level] }}>
              {site.risk_level}
            </div>
            <p className="text-paper/40 text-xs mt-3 leading-relaxed">{site.temporal_note}</p>
          </div>

          {site.out_of_distribution?.is_out_of_distribution && (
            <div className="border border-coral-500/40 bg-coral-500/10 rounded px-3 py-2.5 text-coral-400 text-xs leading-relaxed">
              <div className="font-medium mb-1">
                ⚠ Outside the model's trained experience ({site.out_of_distribution.multiples_of_threshold}x
                beyond the in-distribution threshold)
              </div>
              {site.out_of_distribution_warning}
            </div>
          )}

          {site.calibrated_risk_set?.available && (
            <div
              className={`rounded px-3 py-2.5 border text-xs leading-relaxed ${
                site.calibrated_risk_set.risk_set.length > 1
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-sage-500/30 bg-sage-500/5 text-sage-400'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wide mb-1 opacity-70">
                calibrated risk set (statistically guaranteed, not a heuristic)
              </div>
              <div className="font-medium">
                {site.calibrated_risk_set.risk_set.join(' or ')}
                <span className="opacity-60"> — ≥{Math.round(site.calibrated_risk_set.target_coverage * 100)}% guaranteed coverage</span>
              </div>
              <div className="opacity-70 mt-1">{site.calibrated_risk_set.note}</div>
            </div>
          )}

          <DataCompleteness completeness={site.data_completeness} confidenceLabel={site.confidence_label} />

          <div className="border border-ink-700 rounded p-4">
            <div className="text-paper/40 text-xs font-mono mb-2">why this risk?</div>
            <ul className="space-y-2">
              {site.top_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-paper/80">
                  <span className={f.direction === 'increases risk' ? 'text-coral-400' : 'text-sage-400'}>
                    {f.direction === 'increases risk' ? '▲' : '▼'}
                  </span>
                  <span>{f.plain_language}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-paper/40 text-xs font-mono mb-2">demo simulation walkthrough</div>
            <DemoStepper siteKey={site.site_key} />
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  )
}
