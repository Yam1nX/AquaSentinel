import React, { useEffect, useState } from 'react'
import { api } from '../api'
import DoeEvalPanel from './DoeEvalPanel'

export default function CrossRegionEval() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.crossRegionEval().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="text-coral-400 text-sm font-mono">{error}</div>
  if (!data) return <div className="text-paper/40 font-mono text-sm">loading cross-region evaluation…</div>

  const rf = data.eu_evaluation.station_level_random_forest

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-ink-700 rounded p-4">
          <div className="text-paper/40 text-[10px] font-mono mb-1">🇪🇺 training domain</div>
          <div className="font-display text-lg text-paper">{data.training_domain}</div>
        </div>
        <div className="border border-ink-700 rounded p-4">
          <div className="text-paper/40 text-[10px] font-mono mb-1">🇧🇩 external test domain</div>
          <div className="font-display text-lg text-paper">{data.external_test_domain}</div>
        </div>
      </div>

      <div className="border border-ink-700 rounded p-4">
        <div className="text-paper/40 text-xs font-mono mb-2">
          EU held-out evaluation (station-level split — no station leaks between train/test)
        </div>
        <div className="flex gap-6 font-mono text-sm">
          <div>
            <span className="text-paper/40">accuracy </span>
            <span className="text-sage-400">{(rf.accuracy * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-paper/40">macro-F1 </span>
            <span className="text-sage-400">{rf.macro_f1}</span>
          </div>
        </div>
        <p className="text-paper/30 text-[11px] mt-2">{data.eu_evaluation.description}</p>
      </div>

      <DoeEvalPanel />

      <div className="border border-amber-500/40 bg-amber-500/5 rounded p-4">
        <div className="text-amber-400 text-xs font-mono mb-2">
          ⚠ {data.bangladesh_external_stress_test.warning}
        </div>
        <div className="text-paper/70 text-sm mb-3">
          Agreement with rule-based screening label:{' '}
          <span className="font-mono text-paper">
            {data.bangladesh_external_stress_test.agreement_with_rule_based_label}
          </span>
        </div>

        <div className="space-y-3">
          {data.bangladesh_external_stress_test.sites.map((s) => (
            <div key={s.site_key} className="border-t border-amber-500/20 pt-3">
              <div className="text-sm text-paper/80 font-medium mb-1">{s.label}</div>
              <div className="flex gap-4 text-xs font-mono">
                <span>
                  model: <span className="text-paper/80">{s.model_prediction}</span>
                </span>
                <span>
                  rule-based: <span className="text-paper/80">{s.rule_based_label}</span>
                </span>
                <span className={s.agrees_with_rule ? 'text-sage-400' : 'text-coral-400'}>
                  {s.agrees_with_rule ? '✓ agree' : '✗ disagree'}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-paper/50">
                {Object.entries(s.domain_shift_zscore).map(([param, z]) => (
                  <span key={param} className={Math.abs(z) > 3 ? 'text-coral-400' : ''}>
                    {param} z={z}
                  </span>
                ))}
              </div>
              {s.out_of_distribution && (
                <div className={`mt-1.5 text-[10px] font-mono ${s.out_of_distribution.is_out_of_distribution ? 'text-coral-400' : 'text-paper/50'}`}>
                  {s.out_of_distribution.is_out_of_distribution ? '⚠ ' : ''}
                  nearest EU neighbor: {s.out_of_distribution.multiples_of_threshold}x the in-distribution threshold
                  {s.out_of_distribution.is_out_of_distribution ? ' (flagged out-of-distribution)' : ''}
                </div>
              )}
              {s.calibrated_risk_set?.available && (
                <div className={`mt-1 text-[10px] font-mono ${s.calibrated_risk_set.risk_set.length > 1 ? 'text-amber-400' : 'text-sage-400'}`}>
                  calibrated risk set (≥{Math.round(s.calibrated_risk_set.target_coverage * 100)}% guaranteed): {s.calibrated_risk_set.risk_set.join(' or ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-paper/40 text-[11px] mt-3 leading-relaxed">{data.bangladesh_external_stress_test.sites[0]?.note}</p>
      </div>
    </div>
  )
}
