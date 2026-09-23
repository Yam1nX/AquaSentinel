import React, { useState } from 'react'
import DataCompleteness from './DataCompleteness'
import { StackBar, COLORS } from './charts'

const RISK_STYLE = {
  Low: { text: 'text-sage-400', bg: 'bg-sage-500', ring: 'ring-sage-500/30' },
  Medium: { text: 'text-amber-400', bg: 'bg-amber-500', ring: 'ring-amber-500/30' },
  High: { text: 'text-coral-400', bg: 'bg-coral-500', ring: 'ring-coral-500/30' },
}

export default function ResultPanel({ result }) {
  const [mode, setMode] = useState('plain') // 'plain' | 'technical'

  if (!result) {
    return (
      <div className="border border-dashed border-ink-700 rounded p-8 text-center text-paper/30 font-mono text-sm">
        Enter readings and click "Predict Risk" - or load a quick sample - to see
        an assessment here.
      </div>
    )
  }

  const style = RISK_STYLE[result.risk_level] || RISK_STYLE.Medium

  return (
    <div className="space-y-4">
      <div className="border border-ink-700 rounded p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-paper/40 text-xs font-mono mb-1">predicted risk level</div>
            <div className={`font-display text-4xl ${style.text}`}>{result.risk_level}</div>
          </div>
          <div className={`w-3 h-3 rounded-full ${style.bg} ring-4 ${style.ring}`} />
        </div>

        {result.risk_bounds && (
          <div className={`rounded px-3 py-2 mb-4 text-xs leading-relaxed border ${result.bound_adjusted ? 'bg-coral-500/10 border-coral-500/40 text-coral-400' : 'bg-ink-800/40 border-ink-700 text-paper/60'}`}>
            <div className="font-mono text-[10px] uppercase tracking-wide mb-1">
              provable bounds from measured values: {result.risk_bounds.lower_bound}
              {result.risk_bounds.is_determined ? '' : ` → ${result.risk_bounds.upper_bound}`}
            </div>
            {result.risk_bounds.statement}
            {result.risk_bounds.model_overridden && (
              <div className="mt-1 font-medium">{result.risk_bounds.model_overridden}</div>
            )}
          </div>
        )}

        {result.regional_prior && (
          <div className="rounded px-3 py-2 mb-4 text-xs leading-relaxed border bg-amber-500/10 border-amber-500/40 text-amber-400">
            <div className="font-mono text-[10px] uppercase tracking-wide mb-1">
              regional estimate (not a measurement): {result.regional_prior.informed_class}
              {result.regional_prior.informed_class_interval[0] !== result.regional_prior.informed_class_interval[1]
                ? ` (${result.regional_prior.informed_class_interval[0]} to ${result.regional_prior.informed_class_interval[1]})` : ''}
            </div>
            Unmeasured ammonium/nitrate/phosphorus are expected to add about {result.regional_prior.expected_nutrient_points} risk
            points in Dhaka-region rivers (from {result.regional_prior.basis_parameters.join(', ')}).
            <div className="mt-1 text-amber-400/70">{result.regional_prior.warning}</div>
          </div>
        )}

        {result.neural_second_opinion && (
          <div className="rounded px-3 py-2 mb-4 text-xs leading-relaxed border bg-sky-500/10 border-sky-500/30 text-sky-300">
            <div className="font-mono text-[10px] uppercase tracking-wide mb-1.5">
              neural second opinion (mask-aware): {result.neural_second_opinion.risk_level}
              {result.neural_second_opinion.risk_level_after_bounds !== result.neural_second_opinion.risk_level ? ` → ${result.neural_second_opinion.risk_level_after_bounds} after bounds` : ''}
            </div>
            <StackBar height={8} showLabels={false} segments={['Low', 'Medium', 'High'].map((k, i) => ({ label: k, value: result.neural_second_opinion.probabilities[k] || 0, color: [COLORS.sage, COLORS.amber, COLORS.coral][i] }))} />
            <div className="mt-1.5 text-sky-300/70">{result.neural_second_opinion.note}</div>
          </div>
        )}

        {result.low_confidence_warning && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded px-3 py-2 mb-4 text-amber-400 text-xs leading-relaxed">
            ⚠ {result.note}
          </div>
        )}

        {result.out_of_distribution?.is_out_of_distribution && (
          <div className="bg-coral-500/10 border border-coral-500/40 rounded px-3 py-2 mb-4 text-coral-400 text-xs leading-relaxed">
            <div className="font-medium mb-1">
              ⚠ Outside the model's trained experience ({result.out_of_distribution.multiples_of_threshold}x
              beyond the in-distribution threshold)
            </div>
            {result.out_of_distribution_warning}
          </div>
        )}

        <div className="mb-5">
          <div className="text-paper/40 text-xs font-mono mb-2">confidence (model probability)</div>
          <div className="space-y-1.5">
            {Object.entries(result.confidence)
              .sort((a, b) => b[1] - a[1])
              .map(([cls, p]) => (
                <div key={cls} className="flex items-center gap-2">
                  <span className="w-14 text-xs font-mono text-paper/60">{cls}</span>
                  <div className="flex-1 h-2 bg-ink-950 rounded overflow-hidden">
                    <div
                      className={RISK_STYLE[cls]?.bg || 'bg-paper/40'}
                      style={{ width: `${p * 100}%`, height: '100%' }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-mono text-paper/50">
                    {Math.round(p * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        {result.calibrated_risk_set && (
          <div
            className={`rounded px-3 py-2.5 mb-5 border text-xs leading-relaxed ${
              result.calibrated_risk_set.available
                ? result.calibrated_risk_set.risk_set.length > 1
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-sage-500/30 bg-sage-500/5 text-sage-400'
                : 'border-ink-700 text-paper/40'
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-wide mb-1 opacity-70">
              calibrated risk set (statistically guaranteed, not a heuristic)
            </div>
            {result.calibrated_risk_set.available ? (
              <>
                <div className="font-medium">
                  {result.calibrated_risk_set.risk_set.join(' or ')}
                  <span className="opacity-60"> — ≥{Math.round(result.calibrated_risk_set.target_coverage * 100)}% guaranteed coverage</span>
                </div>
                <div className="opacity-70 mt-1">{result.calibrated_risk_set.note}</div>
              </>
            ) : (
              <div>{result.calibrated_risk_set.note}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="text-paper/40 text-xs font-mono">why this risk?</div>
          <div className="flex gap-1 text-[10px] font-mono">
            <button
              onClick={() => setMode('plain')}
              className={`px-2 py-0.5 rounded border ${mode === 'plain' ? 'border-amber-500 text-amber-400' : 'border-ink-700 text-paper/40'}`}
            >
              plain language
            </button>
            <button
              onClick={() => setMode('technical')}
              className={`px-2 py-0.5 rounded border ${mode === 'technical' ? 'border-amber-500 text-amber-400' : 'border-ink-700 text-paper/40'}`}
            >
              technical (SHAP)
            </button>
          </div>
        </div>

        <ul className="space-y-2.5">
          {result.top_factors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={f.direction === 'increases risk' ? 'text-coral-400' : 'text-sage-400'}>
                {f.direction === 'increases risk' ? '▲' : '▼'}
              </span>
              {mode === 'plain' ? (
                <span className="text-paper/80 leading-relaxed">
                  {f.plain_language}
                  {f.was_imputed && <span className="text-paper/40 font-mono text-xs"> (estimated)</span>}
                </span>
              ) : (
                <span className="text-paper/80">
                  <span className="font-medium">{f.parameter}</span>{' '}
                  <span className="font-mono text-paper/50">
                    ({f.value}
                    {f.unit ? ` ${f.unit}` : ''}
                    {f.was_imputed ? ', estimated' : ', measured'}, SHAP {f.impact >= 0 ? '+' : ''}
                    {f.impact})
                  </span>{' '}
                  {f.direction}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-paper/30 text-[11px] mt-3 leading-relaxed border-t border-ink-700 pt-2">
          SHAP contributions are relative to this specific predicted class - "associated with," not
          "caused." They show which inputs shaped the model's output, not a proven causal mechanism.
        </p>
      </div>

      <DataCompleteness
        completeness={result.data_completeness}
        confidenceLabel={result.confidence_label}
        note="Estimated values were imputed because no measurement was available. Predictions relying on substantial imputation are screening signals, not laboratory confirmation."
      />

      {result.recommendations && (
        <div className="border border-ink-700 rounded p-4">
          <div className="text-paper/40 text-xs font-mono mb-2">what next?</div>
          <ol className="space-y-1.5 text-sm text-paper/80 list-decimal list-inside">
            {result.recommendations.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
          <p className="text-paper/30 text-[11px] mt-2 border-t border-ink-700 pt-2">
            {result.recommendations.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}
