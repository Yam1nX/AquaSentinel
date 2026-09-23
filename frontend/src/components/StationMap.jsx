import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const RISK_COLOR = { Low: '#5B8C72', Medium: '#E8A33D', High: '#C1443C' }

const FILTERS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'EARLY WARNING']

const EUROPE_CENTER = [47.5, 8.5]
const EUROPE_ZOOM = 5
const BANGLADESH_CENTER = [23.75, 90.39]
const BANGLADESH_ZOOM = 11


function MapResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function StationMap({
  stations,
  mode = 'europe', // 'europe' | 'bangladesh'
  bangladeshSites = [],
  citizenReports = [],
  onStationClick,
  selectedSiteId,
}) {
  const [filter, setFilter] = useState('ALL')

  const filtered = useMemo(() => {
    if (mode !== 'europe') return []
    if (filter === 'ALL') return stations
    if (filter === 'EARLY WARNING') return stations.filter((s) => s.trend_label === 'Worsening')
    return stations.filter((s) => s.Risk_Level?.toUpperCase() === filter)
  }, [stations, filter, mode])


  const rendered = filtered.slice(0, 6000)

  const center = mode === 'bangladesh' ? BANGLADESH_CENTER : EUROPE_CENTER
  const zoom = mode === 'bangladesh' ? BANGLADESH_ZOOM : EUROPE_ZOOM

  return (
    <div className="relative h-full w-full">
      {mode === 'europe' && (
        <div className="absolute top-3 left-3 z-[1000] flex gap-1.5 flex-wrap max-w-[90%]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded border backdrop-blur-sm transition-colors ${
                filter === f
                  ? 'bg-amber-500 border-amber-500 text-ink-950'
                  : 'bg-ink-950/70 border-ink-700 text-paper/70 hover:border-amber-500/50'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-ink-950/70 border border-ink-700 text-paper/40">
            {rendered.length.toLocaleString()} shown
          </span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] bg-ink-950/80 backdrop-blur-sm border border-ink-700 rounded px-3 py-2 flex gap-3 text-[11px] font-mono">
        {Object.entries(RISK_COLOR).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-paper/70">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-paper/70">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-paper" />
          citizen report
        </span>
      </div>

      <MapContainer
        key={mode}
        center={center}
        zoom={zoom}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizeHandler />

        {mode === 'europe' &&
          rendered.map((s) => (
            <CircleMarker
              key={s.monitoringSiteIdentifier}
              center={[s.lat, s.lon]}
              radius={s.monitoringSiteIdentifier === selectedSiteId ? 7 : 4}
              pathOptions={{
                color: RISK_COLOR[s.Risk_Level] || '#888',
                fillColor: RISK_COLOR[s.Risk_Level] || '#888',
                fillOpacity: 0.75,
                weight: s.monitoringSiteIdentifier === selectedSiteId ? 2 : 0.5,
              }}
              eventHandlers={{ click: () => onStationClick && onStationClick(s.monitoringSiteIdentifier) }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <span className="font-mono text-xs">
                  {s.monitoringSiteName} ({s.countryCode}) — {s.Risk_Level}
                  {s.trend_label ? ` · ${s.trend_label}` : ''}
                </span>
              </Tooltip>
            </CircleMarker>
          ))}

        {mode === 'bangladesh' &&
          bangladeshSites.map((s) => (
            <CircleMarker
              key={s.site_key}
              center={[s.lat, s.lon]}
              radius={9}
              pathOptions={{
                color: RISK_COLOR[s.risk_level] || '#888',
                fillColor: RISK_COLOR[s.risk_level] || '#888',
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <span className="font-mono text-xs">
                  {s.label}
                  <br />
                  Risk: {s.risk_level} · single point-in-time observation
                </span>
              </Popup>
            </CircleMarker>
          ))}

        {citizenReports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lon]}
            radius={6}
            pathOptions={{ color: '#F5F1E7', fillColor: '#F5F1E7', fillOpacity: 0.9, weight: 1.5 }}
          >
            <Popup>
              <span className="font-mono text-xs">
                Citizen observation
                <br />
                {r.free_text || '(no description)'}
                {r.foam_observed && <><br />Foam observed</>}
                {r.unusual_smell && <><br />Unusual smell</>}
                {r.visible_pollution && <><br />Visible pollution</>}
              </span>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
