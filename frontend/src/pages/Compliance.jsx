import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon, Loading, Pill, SectionTitle, pct } from '../components/ui'
import { HBars, Legend, StackBar, COLORS } from '../components/charts'
import { CLASS_SHORT } from '../components/VerdictChips'

const INPUTS = [
  ['pH', 'pH', ''], ['Dissolved oxygen', 'Dissolved oxygen', 'mg/L'], ['BOD5', 'BOD5', 'mg/L'], ['COD', 'COD', 'mg/L'], ['TDS', 'TDS', 'mg/L'],
  ['Ammonium', 'Ammonia-N', 'mg N/L'], ['Nitrate', 'Nitrate', 'mg NO3/L'], ['Phosphate_P', 'Phosphate-P', 'mg P/L'],
  ['E_coli', 'E. coli', '/100 mL'], ['Fecal_coliform', 'Fecal coliform', '/100 mL'], ['Cr', 'Chromium', 'mg/L'], ['Pb', 'Lead', 'mg/L'], ['Hg', 'Mercury', 'mg/L'],
]
const PRESETS = {
  'DoE-style (5 parameters)': { pH: 7.4, 'Dissolved oxygen': 4.8, BOD5: 5, COD: 30, TDS: 200 },
  'Dhaka river, dry season': { pH: 7.3, 'Dissolved oxygen': 0.6, BOD5: 24, COD: 90, TDS: 420, Ammonium: 4.8, Nitrate: 3, Phosphate_P: 1.1, E_coli: 60000 },
  'Fully measured clean stream': { pH: 7.6, 'Dissolved oxygen': 8.2, BOD5: 1.5, COD: 6, TDS: 180, Ammonium: 0.05, Nitrate: 10, Phosphate_P: 0.05, Fecal_coliform: 20, Cr: 0.01, Pb: 0.01, Hg: 0.0001 },
}
const CELL = {
  pass: ['bg-sage-500/25 text-sage-400', <Icon key="p" name="check" className="w-3.5 h-3.5" />],
  fail: ['bg-coral-500/25 text-coral-400', <Icon key="f" name="x" className="w-3.5 h-3.5" />],
  unknown: ['bg-amber-500/10 text-amber-400/80', <Icon key="u" name="help" className="w-3.5 h-3.5" />],
}
const VERDICT = { non_compliant: ['fails', 'text-coral-400'], undetermined: ['unknown', 'text-amber-400'], compliant: ['certified', 'text-sage-400'] }
const SRC_LABEL = { 'DoE_SurfaceGroundWaterReport_2021_2023': 'DoE monthly reports 2021-2023', 'REACH-Dhaka_2017-2021': 'REACH-Dhaka 2017-2021' }

export default function Compliance() {
  const [std, setStd] = useState(null)
  const [vals, setVals] = useState(PRESETS['Dhaka river, dry season'])
  const [res, setRes] = useState(null)
  const [as, setAs] = useState(null)
  const [src, setSrc] = useState('DoE_SurfaceGroundWaterReport_2021_2023')
  useEffect(() => { api.standards().then(setStd); api.assessability().then(setAs) }, [])
  useEffect(() => {
    const r = Object.fromEntries(Object.entries(vals).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, Number(v)]))
    if (!Object.keys(r).length) { setRes(null); return }
    const t = setTimeout(() => api.compliance(r).then(setRes).catch(() => setRes(null)), 150)
    return () => clearTimeout(t)
  }, [vals])
  if (!std || !as) return <Loading />
  const rows = Object.keys(std.parameter_labels)
  const classes = Object.keys(std.classes)
  const a = as.by_source[src]
  const schedRows = Object.entries(a.schedule_parameters_measured_share).map(([k, v]) => ({ label: std.parameter_labels[k] || k, value: v, color: v > 0 ? COLORS.sky : COLORS.coral, right: `${Math.round(v * 100)}%` }))
  const measured = schedRows.filter((r) => r.value > 0).length

  return (
    <div className="max-w-6xl mx-auto w-full px-5 md:px-10 py-8 space-y-10">
      <SectionTitle eyebrow="Environment Conservation Rules 2023 · Schedule 2" title="Three-valued compliance"
        sub="A parameter that was not measured is unknown, never compliant. A use class is certified only when every scheduled parameter was measured and passed." />

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="card p-4 space-y-3">
          <div className="eyebrow">reading</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([k, v]) => <button key={k} onClick={() => setVals(v)} className="px-2 py-1 rounded-md border border-ink-700 text-[11px] text-paper/60 hover:text-sky-300 hover:border-sky-500/50 transition-colors">{k}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INPUTS.map(([k, l, u]) => (
              <label key={k} className="block">
                <span className="text-[10.5px] font-mono text-paper/45">{l}{u && ` (${u})`}</span>
                <input type="number" step="any" value={vals[k] ?? ''} onChange={(e) => setVals({ ...vals, [k]: e.target.value === '' ? undefined : e.target.value })}
                  className="mt-0.5 w-full bg-ink-950/60 border border-ink-700 rounded-md px-2 py-1.5 text-sm font-mono text-paper focus:outline-none focus:border-sky-500/70" />
              </label>
            ))}
          </div>
          <button onClick={() => setVals({})} className="text-[11px] font-mono text-paper/40 hover:text-paper">clear all</button>
        </div>

        <div className="card p-4 overflow-x-auto">
          {res ? (
            <>
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr>
                    <th className="text-left text-[10.5px] font-mono text-paper/40 pb-2 font-normal">parameter</th>
                    {classes.map((c) => <th key={c} className="text-[10.5px] font-mono text-paper/55 pb-2 px-1 font-normal text-center">{CLASS_SHORT[c]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p} className="border-t border-ink-700/40">
                      <td className="py-1.5 text-paper/70 text-[13px]">{std.parameter_labels[p]}</td>
                      {classes.map((c) => {
                        const s = res.classes[c].parameters[p]
                        return <td key={c} className="px-1 py-1 text-center">{s ? <span className={`inline-flex w-7 h-7 rounded-md items-center justify-center ${CELL[s][0]}`} title={s}>{CELL[s][1]}</span> : <span className="text-paper/15">·</span>}</td>
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ink-700">
                    <td className="py-2 font-display">verdict</td>
                    {classes.map((c) => { const [t, cl] = VERDICT[res.classes[c].verdict]; return <td key={c} className={`text-center text-[12px] font-medium ${cl}`}>{t}</td> })}
                  </tr>
                </tbody>
              </table>
              <div className="mt-3"><Legend items={[{ label: 'passes', color: COLORS.sage }, { label: 'fails (provable)', color: COLORS.coral }, { label: 'not measured → unknown', color: COLORS.amber }]} /></div>
              <p className="text-paper/40 text-[11px] mt-2 leading-relaxed">E. coli above a fecal-coliform limit proves that limit is exceeded; E. coli below it proves nothing, so it never passes on its own. Enter fecal coliform directly to test it.</p>
            </>
          ) : <div className="text-paper/40 text-sm font-mono py-16 text-center">enter at least one value</div>}
        </div>
      </div>

      <section className="space-y-5">
        <SectionTitle eyebrow="real monitoring data" title="What can actually be certified?"
          right={<div className="flex gap-1.5">{Object.keys(as.by_source).filter((s) => SRC_LABEL[s]).map((s) => <button key={s} onClick={() => setSrc(s)} className={`px-2.5 py-1.5 rounded-lg text-[11.5px] border transition-colors ${src === s ? 'border-sky-500/60 bg-sky-500/15 text-sky-300' : 'border-ink-700 text-paper/55'}`}>{SRC_LABEL[s]}</button>)}</div>} />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4"><div className="font-display text-lg">Verdict by use class</div><Pill>{a.n_station_months.toLocaleString()} station-months</Pill></div>
            <div className="space-y-4">
              {Object.entries(a.classes).map(([c, v]) => (
                <div key={c}>
                  <div className="text-xs text-paper/65 mb-1.5">{v.label}</div>
                  <StackBar height={12} segments={[{ label: 'provably fails', value: v.non_compliant, color: COLORS.coral }, { label: 'unknown', value: v.undetermined, color: COLORS.amber }, { label: 'certified', value: v.compliant, color: COLORS.sage }]} showLabels={false} />
                </div>
              ))}
            </div>
            <div className="mt-4"><Legend items={[{ label: 'provably fails', color: COLORS.coral }, { label: 'unknown', color: COLORS.amber }, { label: 'certified', color: COLORS.sage }]} /></div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1"><div className="font-display text-lg">Schedule parameters measured</div><Pill tone="amber">{measured} of {schedRows.length}</Pill></div>
            <p className="text-paper/45 text-xs mb-4">Share of station-months in which each legally scheduled parameter has a value.</p>
            <HBars rows={schedRows} labelWidth={110} />
            <p className="text-paper/40 text-[11px] mt-3 leading-relaxed">Metals are never reported and phosphate is not in the merged master table. E. coli (REACH only) can prove a fecal-coliform failure but not a pass.</p>
          </div>
        </div>
        {src.startsWith('DoE') && (
          <div className="card p-5">
            <div className="font-display text-lg mb-1">Fisheries standard: provable failures by river</div>
            <p className="text-paper/45 text-xs mb-4">Driven by: {Object.entries(as.doe_drivers_of_failure_fisheries).map(([k, v]) => `${k} ${pct(v, 0)}`).join(' · ')} of station-months.</p>
            <HBars rows={as.doe_fisheries_non_compliant_by_river.map((r) => ({ label: `${r.river} (${r.n})`, value: r.non_compliant, color: COLORS.coral }))} labelWidth={150} />
          </div>
        )}
        <p className="text-paper/35 text-[11px] font-mono">{as.note}</p>
      </section>
    </div>
  )
}
