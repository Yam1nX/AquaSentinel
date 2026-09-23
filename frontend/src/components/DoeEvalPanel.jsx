import React, { useEffect, useState } from 'react'
import { api } from '../api'

const pct = (x) => `${(x * 100).toFixed(1)}%`

export default function DoeEvalPanel() {
  const [ev, setEv] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.bangladeshDoeEval().then(setEv).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="text-coral-400 text-sm font-mono">{error}</div>
  if (!ev) return <div className="text-paper/40 font-mono text-sm">loading DoE evaluation…</div>

  return (
    <div className="border border-sage-500/40 bg-sage-500/5 rounded p-4 space-y-4">
      <div>
        <div className="text-sage-400 text-xs font-mono mb-1">
          powered evaluation · real Bangladesh DoE monthly data, {ev.years.join('–')}
        </div>
        <div className="text-paper/70 text-sm">
          {ev.n_station_months.toLocaleString()} station-months · {ev.n_stations} stations · {ev.n_rivers} rivers/lakes
          (replaces the earlier 18-observation stress test)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
        <div className="border border-ink-700 rounded p-3">
          <div className="text-paper/40 text-[10px]">provably High from measured values</div>
          <div className="text-coral-400 text-lg">{pct(ev.guaranteed_high_share)}</div>
        </div>
        <div className="border border-ink-700 rounded p-3">
          <div className="text-paper/40 text-[10px]">EU-trained model predicts High</div>
          <div className="text-amber-400 text-lg">{pct(ev.model_pred_share.High)}</div>
        </div>
        <div className="border border-ink-700 rounded p-3">
          <div className="text-paper/40 text-[10px]">model below provable bound</div>
          <div className="text-coral-400 text-lg">{pct(ev.model_violates_lower_bound_share)}</div>
        </div>
        <div className="border border-ink-700 rounded p-3">
          <div className="text-paper/40 text-[10px]">OOD score vs bound violation (AUROC)</div>
          <div className="text-sage-400 text-lg">{ev.ood_auroc_for_lower_bound_violation}</div>
        </div>
      </div>

      {ev.with_regional_prior && (
        <div className="border border-amber-500/40 bg-amber-500/5 rounded p-3 text-[11px] font-mono text-paper/70 space-y-1">
          <div className="text-amber-400">
            Dhaka-region rivers only ({ev.with_regional_prior.n_station_months_in_domain} station-months): regional nutrient prior from REACH-Dhaka
          </div>
          <div>provable lower bound High: {pct(ev.with_regional_prior.provable_lower_bound_share_same_rows.High)}</div>
          <div>prior-informed estimate High: {pct(ev.with_regional_prior.prior_class_share.High)}</div>
          <div>EU-trained model High: {pct(ev.with_regional_prior.naive_model_class_share_same_rows.High)}</div>
          <div className="text-paper/40">{ev.with_regional_prior.caveat}</div>
        </div>
      )}

      <div>
        <div className="text-paper/40 text-[10px] font-mono mb-1">by river (top 15 by sample size)</div>
        <table className="w-full text-[11px] font-mono text-paper/70">
          <thead>
            <tr className="text-paper/40 text-left">
              <th>river</th><th>n</th><th>provably High</th><th>model below bound</th><th>OOD flagged</th>
            </tr>
          </thead>
          <tbody>
            {ev.by_river.map((r) => (
              <tr key={r.river} className="border-t border-ink-700">
                <td>{r.river}</td><td>{r.n}</td>
                <td>{pct(r.guaranteed_high)}</td><td>{pct(r.model_violates)}</td><td>{pct(r.ood)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-paper/40 text-[11px] leading-relaxed">
        {ev.note} The OOD/bound-violation association is descriptive: both depend on the same extreme DO/BOD values,
        so it is not an independent validation of the OOD detector.
      </p>
    </div>
  )
}
