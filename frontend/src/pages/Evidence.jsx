import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Loading, SectionTitle, pct } from '../components/ui'
import { HBars, StackBar, Legend, COLORS } from '../components/charts'
import CrossRegionEval from '../components/CrossRegionEval'

const NAMES = ['Low', 'Medium', 'High']
const TONES = [COLORS.sage, COLORS.amber, COLORS.coral]

export default function Evidence() {
  const [o, setO] = useState(null)
  useEffect(() => { api.overview().then(setO) }, [])
  if (!o) return <Loading />
  const re = o.reach, extra = re.extra_points_from_unmeasured_nutrients, fp = re.field_probe_recovery_leave_location_out, ex = re.exceedance_share
  const wp = o.doe_eval.with_regional_prior
  const seg = (share) => NAMES.map((k, i) => ({ label: k, value: share?.[k] || 0, color: TONES[i] }))
  return (
    <div className="max-w-5xl mx-auto w-full px-5 md:px-10 py-8 space-y-10">
      <SectionTitle eyebrow="evidence" title="What the numbers support, and what they do not" />

      {wp && (
        <section className="card p-5 md:p-6 space-y-4">
          <div className="font-display text-xl">Dhaka-region rivers · {wp.n_station_months_in_domain} DoE station-months</div>
          <div><div className="text-xs font-mono text-paper/50 mb-1.5">provable lower bound from measured values</div><StackBar segments={seg(wp.provable_lower_bound_share_same_rows)} /></div>
          <div><div className="text-xs font-mono text-paper/50 mb-1.5">EU-trained model (median-imputed nutrients)</div><StackBar segments={seg(wp.naive_model_class_share_same_rows)} /></div>
          <div><div className="text-xs font-mono text-paper/50 mb-1.5">regional-prior estimate, inside the provable interval</div><StackBar segments={seg(wp.prior_class_share)} /></div>
          <p className="text-paper/40 text-xs leading-relaxed">{wp.caveat}</p>
        </section>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-display text-lg mb-1">Risk points hidden by missing nutrients</div>
          <p className="text-paper/45 text-xs mb-4">REACH-Dhaka, {re.n_samples} samples. EU-median imputation assumes 0.</p>
          <HBars rows={Object.entries(extra.distribution).map(([k, v]) => ({ label: `+${k} points`, value: v, color: k >= 3 ? COLORS.coral : k >= 1 ? COLORS.amber : COLORS.sage }))} labelWidth={70} max={0.5} />
        </div>
        <div className="card p-5">
          <div className="font-display text-lg mb-1">Recovering them from DO, pH, EC</div>
          <p className="text-paper/45 text-xs mb-4">Mean absolute error in risk points, leave-location-out.</p>
          <HBars max={2.4} labelWidth={130} rows={[
            { label: 'EU-median imputation', value: fp.eu_median_imputation.MAE_points, color: COLORS.coral, right: fp.eu_median_imputation.MAE_points.toFixed(2) },
            { label: 'regional constant', value: fp.regional_constant_median.MAE_points, color: COLORS.amber, right: fp.regional_constant_median.MAE_points.toFixed(2) },
            { label: 'field-probe prior', value: fp.field_probe_random_forest.MAE_points, color: COLORS.sky, right: fp.field_probe_random_forest.MAE_points.toFixed(2) },
          ]} />
          <p className="text-paper/40 text-[11px] mt-3">Validated on points, not on measured class labels.</p>
        </div>
      </section>

      <section className="card p-5">
        <div className="font-display text-lg mb-3">Legal exceedance in Dhaka rivers (REACH)</div>
        <HBars labelWidth={190} color={COLORS.coral} rows={[
          { label: 'DO below 5 mg/L', value: ex.DO_below_5 }, { label: 'ammonia-N above 0.3 mg/L', value: ex['NH4N_above_0.3'] },
          { label: 'ammonia-N above 1.0 mg/L', value: ex['NH4N_above_1.0'] }, { label: 'phosphate-P above 0.5 mg/L', value: ex['PO4P_above_0.5'] },
          { label: 'E. coli above 5,000 /100 mL', value: ex.Ecoli_above_5000_per_100mL },
        ]} />
      </section>

      <CrossRegionEval />
    </div>
  )
}
