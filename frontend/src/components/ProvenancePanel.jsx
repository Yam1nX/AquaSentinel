import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function ProvenancePanel() {
  const [prov, setProv] = useState(null)
  const [card, setCard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.provenance(), api.modelCard()])
      .then(([p, c]) => {
        setProv(p)
        setCard(c)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="text-coral-400 text-sm font-mono">{error}</div>
  if (!prov || !card) return <div className="text-paper/40 font-mono text-sm">loading data & methodology…</div>

  return (
    <div className="space-y-6 text-sm">
      <section>
        <h4 className="font-display text-lg text-paper mb-2">Data & Methodology</h4>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
          <dt className="text-paper/40">Data source</dt>
          <dd className="text-paper/80">{prov.data_source}</dd>
          <dt className="text-paper/40">Coverage</dt>
          <dd className="text-paper/80">{prov.filtered_to}</dd>
          <dt className="text-paper/40">Observations</dt>
          <dd className="text-paper/80">
            {prov.n_observations_rows.toLocaleString()} rows across {prov.n_monitoring_stations.toLocaleString()} stations
          </dd>
          <dt className="text-paper/40">Countries</dt>
          <dd className="text-paper/80">{prov.n_countries} ({prov.countries.join(', ')})</dd>
          <dt className="text-paper/40">Years</dt>
          <dd className="text-paper/80">{prov.year_range[0]}–{prov.year_range[1]}</dd>
          <dt className="text-paper/40">Parameters</dt>
          <dd className="text-paper/80">{prov.parameters.join(', ')}</dd>
        </dl>
      </section>

      <section>
        <h4 className="font-display text-lg text-paper mb-2">Bangladesh Data (own compiled dataset)</h4>
        {!prov.bangladesh_data ? (
          <div className="text-paper/40 text-xs font-mono">no Bangladesh provenance data returned by /api/provenance</div>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
              <dt className="text-paper/40">Data source</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.source || '—'}</dd>
              <dt className="text-paper/40">Coverage</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.coverage || '—'}</dd>
              <dt className="text-paper/40">Observations</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.observations || '—'}</dd>
              <dt className="text-paper/40">Focus rivers</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.rivers_focus?.join(', ') || '—'}</dd>
              <dt className="text-paper/40">Years</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.years || '—'}</dd>
              <dt className="text-paper/40">Parameters</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.parameters?.join(', ') || '—'}</dd>
              <dt className="text-paper/40">Usage</dt>
              <dd className="text-paper/80">{prov.bangladesh_data.usage || '—'}</dd>
            </dl>

            {prov.bangladesh_data.cross_region_result_summary && (
              <div className="bg-ink-950 border border-ink-700 rounded p-3 my-3 text-xs text-paper/60 leading-relaxed">
                <span className="text-paper/80 font-semibold">Headline cross-region finding: </span>
                model/rule agreement {prov.bangladesh_data.cross_region_result_summary.model_vs_rule_agreement_38_river_years || 'n/a'} on the
                3-river annual panel; out-of-distribution flagged on {prov.bangladesh_data.cross_region_result_summary.out_of_distribution_flagged_38_river_years || 'n/a'}.
                {prov.bangladesh_data.cross_region_result_summary.powered_28_river_result && (
                  <>
                    {' '}On the larger, powered 28-river / {(prov.bangladesh_data.cross_region_result_summary.powered_28_river_result.n_station_months ?? 0).toLocaleString()}-station-month
                    evaluation, the OOD detector predicts the model's own lower-bound violations at AUROC {prov.bangladesh_data.cross_region_result_summary.powered_28_river_result.ood_auroc_for_lower_bound_violation ?? 'n/a'}.
                  </>
                )}
              </div>
            )}

            {prov.bangladesh_data.attribution && (
              <>
                <div className="text-paper/40 text-[10px] font-mono uppercase tracking-wide mb-1">Attribution</div>
                <ul className="space-y-1.5 text-[11px] text-paper/55 list-disc list-inside leading-relaxed">
                  {prov.bangladesh_data.attribution.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section>
        <h4 className="font-display text-lg text-paper mb-2">Model & Limitations</h4>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-xs mb-3">
          <dt className="text-paper/40">Purpose</dt>
          <dd className="text-paper/80">{card.purpose}</dd>
          <dt className="text-paper/40">Model</dt>
          <dd className="text-paper/80">{card.model_type}</dd>
          <dt className="text-paper/40">Training data</dt>
          <dd className="text-paper/80">{card.training_data}</dd>
          <dt className="text-paper/40">External testing</dt>
          <dd className="text-paper/80">{card.external_testing}</dd>
        </dl>

        <div className="bg-ink-950 border border-ink-700 rounded p-3 mb-3 text-xs text-paper/60 leading-relaxed">
          {card.evaluation?.important_caveat}
        </div>

        <div className="text-xs text-paper/60 mb-3">{card.evaluation?.class_distribution_note}</div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.entries(card.evaluation?.baselines || {}).map(([name, m]) => (
            <div key={name} className="border border-ink-700 rounded p-2 text-center">
              <div className="text-paper/40 text-[10px] font-mono mb-1">{name.replace(/_/g, ' ')}</div>
              <div className="text-paper/80 font-mono text-sm">{((m.accuracy ?? 0) * 100).toFixed(1)}%</div>
              <div className="text-paper/40 font-mono text-[10px]">macro-F1 {m.macro_f1}</div>
            </div>
          ))}
        </div>

        <ul className="space-y-1.5 text-xs text-paper/60 list-disc list-inside">
          {(card.known_limitations || []).map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
