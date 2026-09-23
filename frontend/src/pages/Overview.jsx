import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon, Loading, Pill, Stat, SectionTitle, pct } from '../components/ui'
import { StackBar, COLORS } from '../components/charts'

const STEPS = [
  { icon: 'book', title: 'Extract', body: 'Monthly station tables were parsed out of Bangladesh Department of Environment PDFs (2021-2023) and merged with REACH-Dhaka field data (2017-2021).' },
  { icon: 'alert', title: 'Bound', body: 'Every scored parameter can only add risk points, so what was measured already gives a provable lower bound on risk. A model may not predict below it.' },
  { icon: 'droplet', title: 'Estimate', body: 'For Dhaka-region rivers, an opt-in regional prior estimates the missing ammonia, nitrate and phosphorus contribution from DO, pH and EC.' },
  { icon: 'shield', title: 'Certify', body: 'Compliance with the 2023 legal standards is three-valued: pass, fail or unknown. An unmeasured parameter is never assumed compliant.' },
]

export default function Overview({ onNavigate }) {
  const [o, setO] = useState(null)
  const [err, setErr] = useState(null)
  const [ctx, setCtx] = useState(null)
  useEffect(() => { api.overview().then(setO).catch((e) => setErr(e.message)) }, [])
  useEffect(() => { api.context().then(setCtx).catch(() => {}) }, [])
  if (err) return <div className="p-10 text-coral-400 font-mono text-sm">{err}</div>
  if (!o) return <Loading />

  const ev = o.doe_eval || {}, re = o.reach || {}, as = o.assessability || {}
  const extra = re.extra_points_from_unmeasured_nutrients || {}
  const nm = ctx?.national_monitoring_scale
  const cc = ctx?.coastal_salinity_climate_context
  return (
    <div className="max-w-6xl mx-auto w-full px-5 md:px-10 py-8 md:py-12 space-y-12">
      <section className="relative">
        <div className="absolute inset-x-0 -top-10 h-64 grid-bg pointer-events-none" />
        <div className="relative animate-fade-up">
          <div className="flex gap-2 mb-5 flex-wrap">
            <Pill tone="sky">Track 6 · Resilience Informatics</Pill>
            <Pill>{o.master?.station_months?.toLocaleString()} station-months</Pill>
            <Pill>DoE 2021-23 · REACH-Dhaka 2017-21</Pill>
            {nm && <Pill tone="amber">DoE labs {nm.doe_actively_monitored_rivers_2021_2023} of {nm.total_named_rivers_streams_canals} named rivers ({nm.share_actively_monitored_pct}%)</Pill>}
          </div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-4xl text-gradient">
            The law asks 12 questions about a river. Monitoring answers five.
          </h2>
          <p className="text-paper/60 text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
            AquaSentinel turns partial water-quality data into risk statements that are provably valid: what is certainly bad,
            what is merely unmeasured, and what a regional model can estimate without pretending to know.
          </p>
          <div className="flex gap-3 mt-7 flex-wrap">
            <button onClick={() => onNavigate('compliance')} className="px-4 py-2.5 rounded-lg bg-sky-500 text-ink-950 text-sm font-medium hover:bg-sky-400 transition-colors inline-flex items-center gap-2">
              Check a reading against the law <Icon name="arrow" />
            </button>
            <button onClick={() => onNavigate('observatory')} className="px-4 py-2.5 rounded-lg border border-ink-700 text-paper/80 text-sm hover:border-sky-500/60 transition-colors inline-flex items-center gap-2">
              Explore Dhaka's rivers <Icon name="map" />
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="what the data says" title="Four numbers that frame the problem" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          <Stat label="provably failing fisheries standard" value={100 * (as.share_provably_failing_fisheries || 0)} decimals={1} suffix="%" tone="coral" hint={`of ${as.n_station_months?.toLocaleString()} station-months, from measured values alone`} />
          <Stat label="certifiable as compliant, any class" value={100 * (as.share_certifiable_any_class || 0)} decimals={1} suffix="%" tone="amber" hint="ammonia, nitrate, phosphorus, metals and coliform are never all measured" />
          <Stat label="risk points hidden in Dhaka rivers" value={extra.mean} decimals={1} tone="sky" hint="mean points added by the nutrients DoE does not report (REACH-Dhaka)" />
          <Stat label="EU-trained model predicts High" value={100 * (ev.model_pred_share?.High || 0)} decimals={1} suffix="%" tone="sage" hint={`while ${pct(ev.guaranteed_high_share)} of Bangladesh station-months are provably High`} />
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="the gap, measured" title="A model trained abroad is optimistic where it matters"
          sub="On real DoE station-months, the EU-trained classifier never predicts High. The measured values alone prove otherwise." />
        <div className="card p-5 md:p-6 space-y-5">
          <div>
            <div className="text-xs font-mono text-paper/50 mb-2">provable lower bound (from measured DO, BOD, pH)</div>
            <StackBar segments={['Low', 'Medium', 'High'].map((k, i) => ({ label: k, value: ev.lb_class_share?.[k] || 0, color: [COLORS.sage, COLORS.amber, COLORS.coral][i] }))} />
          </div>
          <div>
            <div className="text-xs font-mono text-paper/50 mb-2">EU-trained model prediction</div>
            <StackBar segments={['Low', 'Medium', 'High'].map((k, i) => ({ label: k, value: ev.model_pred_share?.[k] || 0, color: [COLORS.sage, COLORS.amber, COLORS.coral][i] }))} />
          </div>
          <p className="text-paper/45 text-xs leading-relaxed">
            The model sits below the provable bound in {pct(ev.model_violates_lower_bound_share)} of cases. AquaSentinel projects every prediction into the feasible interval.
            Lower-bound classes use only measured pH, DO and BOD, so they understate true risk.
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="method" title="From partial data to defensible statements" />
        <div className="grid md:grid-cols-4 gap-3 stagger">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-300 flex items-center justify-center"><Icon name={s.icon} className="w-[18px] h-[18px]" /></span>
                <span className="font-mono text-paper/25 text-xs">0{i + 1}</span>
              </div>
              <div className="font-display text-lg mb-1.5">{s.title}</div>
              <p className="text-paper/55 text-[13px] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {(nm || cc) && (
        <section>
          <SectionTitle eyebrow="why this matters nationally" title="A monitoring gap, and a climate driver behind it" />
          <div className="grid md:grid-cols-2 gap-3">
            {nm && (
              <div className="card p-5 md:p-6">
                <div className="font-mono text-3xl text-amber-300 mb-1">{nm.share_actively_monitored_pct}%</div>
                <div className="text-paper/70 text-sm mb-2">of Bangladesh's {nm.total_named_rivers_streams_canals} nationally listed rivers, streams and canals get DoE lab sampling</div>
                <p className="text-paper/45 text-xs leading-relaxed">{nm.note}</p>
                <div className="text-paper/30 text-[10px] font-mono mt-2">Source: {nm.source}</div>
              </div>
            )}
            {cc && (
              <div className="card p-5 md:p-6">
                <div className="font-mono text-3xl text-sky-300 mb-1">
                  {cc.trend_by_region_mm_per_year?.ganges_tidal_floodplain_western_coastal_region} mm/yr
                </div>
                <div className="text-paper/70 text-sm mb-2">sea-level rise in the same coastal zone as Pashur, Rupsha and Kakshiali — AquaSentinel's highest-salinity rivers</div>
                <p className="text-paper/45 text-xs leading-relaxed">{cc.relevance_to_aquasentinel_rivers}</p>
                <p className="text-paper/30 text-[10px] leading-relaxed mt-2 italic">{cc.caveat}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card p-5 md:p-6">
        <div className="eyebrow mb-2">honest limits</div>
        <ul className="text-paper/60 text-sm space-y-1.5 leading-relaxed list-disc pl-5">
          <li>The regional prior is validated on risk points in Dhaka rivers, not on measured class labels, and is not applied elsewhere.</li>
          <li>Legal limits were transcribed from the 2023 gazette page image and must be checked before citation.</li>
          <li>REACH (probe based) and DoE (laboratory) dissolved-oxygen values are not interchangeable.</li>
          <li>Screening tool only. It does not replace laboratory testing or regulatory assessment.</li>
        </ul>
      </section>
    </div>
  )
}
