import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { api } from '../api'
import { Loading, Pill, SectionTitle, Stat } from '../components/ui'
import { Legend, TimeChart, COLORS } from '../components/charts'

const METRICS = {
  median_DO: { label: 'Median DO (mg/L)', unit: 'mg/L', good: 'high', lo: 0, hi: 7, ref: 5 },
  median_ammonia_N: { label: 'Median ammonia-N (mg/L)', unit: 'mg/L', good: 'low', lo: 0, hi: 8, ref: 0.3 },
  median_ecoli: { label: 'Median E. coli (/100 mL)', unit: '/100 mL', good: 'low', lo: 0, hi: 20000, ref: 5000 },
  'share_DO_below_5': { label: 'Share of samples with DO < 5', unit: '', good: 'low', lo: 0, hi: 1, ref: null },
}
const PARAMS = [['Dissolved oxygen', 'DO (mg/L)', 5], ['Ammonium', 'Ammonia-N (mg/L)', 0.3], ['Nitrate', 'Nitrate (mg NO3/L)', null], ['BOD5', 'BOD5 (mg/L, DoE)', 6], ['COD', 'COD (mg/L)', 50]]
const SRC = { 'REACH-Dhaka_2017-2021': ['REACH-Dhaka', COLORS.sky], 'DoE_SurfaceGroundWaterReport_2021_2023': ['DoE', COLORS.amber] }

function color(v, m) {
  if (v == null) return '#6b7d7b'
  let t = (v - m.lo) / (m.hi - m.lo); t = Math.max(0, Math.min(1, t)); if (m.good === 'high') t = 1 - t
  const stops = [[91, 140, 114], [234, 179, 95], [217, 105, 95]]
  const i = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2
  const c = stops[i].map((a, k) => Math.round(a + (stops[i + 1][k] - a) * u))
  return `rgb(${c.join(',')})`
}
function Fit({ pts }) {
  const map = useMap()
  useEffect(() => { if (pts.length) map.fitBounds(pts.map((p) => [p.lat, p.lon]), { padding: [30, 30] }) }, [pts.length])
  useEffect(() => { const ro = new ResizeObserver(() => map.invalidateSize()); ro.observe(map.getContainer()); return () => ro.disconnect() }, [map])
  return null
}

export default function Observatory() {
  const [pts, setPts] = useState(null)
  const [ov, setOv] = useState(null)
  const [metric, setMetric] = useState('median_DO')
  const [river, setRiver] = useState('Buriganga')
  const [param, setParam] = useState('Dissolved oxygen')
  const [series, setSeries] = useState(null)
  useEffect(() => { api.reachPoints().then((d) => setPts(d.stations)); api.overview().then(setOv) }, [])
  useEffect(() => {
    setSeries(null)
    api.masterRiver(river, param).then((d) => setSeries(d.points)).catch(() => setSeries([]))
  }, [river, param])
  const rivers = useMemo(() => (pts ? [...new Set(pts.map((p) => p.river))].sort() : []), [pts])
  const m = METRICS[metric]
  const bySrc = useMemo(() => {
    if (!series) return []
    return Object.entries(SRC).map(([k, [name, col]]) => ({ name, color: col, points: series.filter((p) => p.source === k).map((p) => ({ ym: p.ym, y: p.median, n: p.count })) })).filter((s) => s.points.length)
  }, [series])
  const ref = PARAMS.find((p) => p[0] === param)?.[2]
  const extra = ov?.reach?.extra_points_from_unmeasured_nutrients
  const ex = ov?.reach?.exceedance_share

  if (!pts) return <Loading text="loading Dhaka observatory…" />
  return (
    <div className="max-w-7xl mx-auto w-full px-5 md:px-10 py-8 space-y-8">
      <SectionTitle eyebrow="REACH-Dhaka · 58 sampling points · 2017-2021" title="Dhaka's rivers, with the nutrients the regulator never sees"
        sub="Ammonia, nitrate and E. coli were measured directly here. They show what an oxygen-and-BOD-only view leaves out." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="samples with full nutrients" value={ov?.reach?.n_samples} tone="sky" />
        <Stat label="mean risk points hidden" value={extra?.mean} decimals={1} tone="amber" hint="median 3 of a possible 4" />
        <Stat label="ammonia-N above 0.3 mg/L" value={100 * (ex?.['NH4N_above_0.3'] || 0)} decimals={1} suffix="%" tone="coral" />
        <Stat label="E. coli above 5,000 / 100 mL" value={100 * (ex?.Ecoli_above_5000_per_100mL || 0)} decimals={1} suffix="%" tone="coral" />
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4">
        <div className="card overflow-hidden">
          <div className="p-3 flex flex-wrap gap-1.5 border-b border-ink-700/60">
            {Object.entries(METRICS).map(([k, v]) => (
              <button key={k} onClick={() => setMetric(k)} className={`px-2.5 py-1 rounded-md text-[11.5px] font-mono transition-colors ${metric === k ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40' : 'text-paper/50 hover:text-paper'}`}>{v.label}</button>
            ))}
          </div>
          <div className="h-[420px]">
            <MapContainer center={[23.8, 90.4]} zoom={10} scrollWheelZoom className="h-full w-full">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Fit pts={pts} />
              {pts.map((p) => (
                <CircleMarker key={p.station} center={[p.lat, p.lon]} radius={river === p.river ? 9 : 7} pathOptions={{ color: river === p.river ? '#0B1F1E' : '#0B1F1E99', weight: river === p.river ? 2.5 : 1, fillColor: color(p[metric], m), fillOpacity: 0.92 }}
                  eventHandlers={{ click: () => setRiver(p.river) }}>
                  <Popup>
                    <div className="text-xs leading-relaxed"><b>{p.station}</b><br />{p.river} · n={p.n}<br />DO {p.median_DO} mg/L · NH3-N {p.median_ammonia_N} mg/L<br />NO3 {p.median_nitrate} mg/L · E. coli {p.median_ecoli?.toLocaleString()}</div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="px-3 py-2 border-t border-ink-700/60 flex items-center justify-between text-[11px] font-mono text-paper/50">
            <span>{m.label}: green = better, red = worse</span>{m.ref != null && <span>legal reference ≈ {m.ref}</span>}
          </div>
        </div>

        <div className="card p-4 md:p-5 space-y-4">
          <div>
            <div className="eyebrow mb-2">river</div>
            <div className="flex flex-wrap gap-1.5">
              {rivers.map((r) => <button key={r} onClick={() => setRiver(r)} className={`px-2.5 py-1 rounded-full text-[11.5px] border transition-colors ${river === r ? 'border-sky-500/60 bg-sky-500/15 text-sky-300' : 'border-ink-700 text-paper/60 hover:text-paper'}`}>{r}</button>)}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2">parameter</div>
            <div className="flex flex-wrap gap-1.5">
              {PARAMS.map(([k, l]) => <button key={k} onClick={() => setParam(k)} className={`px-2.5 py-1 rounded-md text-[11.5px] font-mono border transition-colors ${param === k ? 'border-amber-500/60 bg-amber-500/10 text-amber-400' : 'border-ink-700 text-paper/60 hover:text-paper'}`}>{l}</button>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><div className="text-sm font-display">{river} · monthly median</div><Legend items={[{ label: 'REACH-Dhaka', color: COLORS.sky }, { label: 'DoE', color: COLORS.amber }]} /></div>
            {series ? <TimeChart series={bySrc} refLine={ref} height={230} /> : <Loading />}
            <p className="text-paper/40 text-[11px] leading-relaxed mt-2">Two independent sources. Probe-based REACH and laboratory DoE dissolved oxygen differ for the same river, so they are plotted separately, not pooled.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
