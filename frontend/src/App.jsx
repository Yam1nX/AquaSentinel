import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import TabBar from './components/TabBar'
import StationMap from './components/StationMap'
import ReadingForm from './components/ReadingForm'
import ResultPanel from './components/ResultPanel'
import StationTrendPanel from './components/StationTrendPanel'
import BangladeshPanel from './components/BangladeshPanel'
import CrossRegionEval from './components/CrossRegionEval'
import ProvenancePanel from './components/ProvenancePanel'
import CitizenReportForm from './components/CitizenReportForm'
import PriorityPanel from './components/PriorityPanel'
import ComplianceMini from './components/ComplianceMini'
import Overview from './pages/Overview'
import Observatory from './pages/Observatory'
import Compliance from './pages/Compliance'
import Evidence from './pages/Evidence'
import { api } from './api'

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'europe', label: 'Assess a reading', icon: 'assess' },
  { key: 'observatory', label: 'Dhaka Observatory', icon: 'map', badge: 'new' },
  { key: 'compliance', label: 'Legal compliance', icon: 'shield', badge: 'new' },
  { key: 'evidence', label: 'Evidence', icon: 'flask' },
  { key: 'priority', label: 'Inspection priority', icon: 'list' },
  { key: 'bangladesh', label: 'Bangladesh demo', icon: 'globe' },
  { key: 'methodology', label: 'Data & method', icon: 'book' },
]

export default function App() {
  const [tab, setTab] = useState('overview')
  const [stations, setStations] = useState([])
  const [bangladeshSites, setBangladeshSites] = useState([])
  const [citizenReports, setCitizenReports] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState(null)
  const [result, setResult] = useState(null)
  const [lastPayload, setLastPayload] = useState(null)
  const [showCitizenForm, setShowCitizenForm] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    api.stations().then(setStations).catch((e) => setLoadError(e.message))
    api.bangladeshSites().then(setBangladeshSites).catch(() => {})
    api.citizenReports().then(setCitizenReports).catch(() => {})
  }, [])

  const refreshCitizenReports = () => {
    api.citizenReports().then(setCitizenReports).catch(() => {})
  }

  const goToStation = (siteId) => {
    setSelectedSiteId(siteId)
    setTab('europe')
  }

  const mapMode = tab === 'bangladesh' ? 'bangladesh' : 'europe'
  const reportDefaultLat = mapMode === 'bangladesh' ? 23.75 : 47.5
  const reportDefaultLon = mapMode === 'bangladesh' ? 90.39 : 8.5

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onReportClick={() => setShowCitizenForm((v) => !v)} />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {showCitizenForm && (
        <div className="border-b border-ink-700/60 px-6 md:px-10 py-4 bg-ink-950/40 shrink-0 max-h-[45vh] overflow-y-auto">
          <div className="max-w-md">
            <CitizenReportForm
              defaultLat={reportDefaultLat}
              defaultLon={reportDefaultLon}
              onSubmitted={() => {
                refreshCitizenReports()
                setShowCitizenForm(false)
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {tab === 'overview' && <main className="h-full overflow-y-auto"><Overview onNavigate={setTab} /></main>}
        {tab === 'observatory' && <main className="h-full overflow-y-auto"><Observatory /></main>}
        {tab === 'compliance' && <main className="h-full overflow-y-auto"><Compliance /></main>}
        {tab === 'evidence' && <main className="h-full overflow-y-auto"><Evidence /></main>}

        {(tab === 'europe' || tab === 'bangladesh') && (
          <main className="h-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
            <section className="h-[45vh] lg:h-full min-h-0 border-b lg:border-b-0 lg:border-r border-ink-700/60">
              {loadError ? (
                <div className="h-full flex items-center justify-center text-coral-400 text-sm font-mono p-6 text-center">
                  Could not load station data: {loadError}
                </div>
              ) : (
                <StationMap
                  stations={stations}
                  mode={mapMode}
                  bangladeshSites={bangladeshSites}
                  citizenReports={citizenReports}
                  selectedSiteId={selectedSiteId}
                  onStationClick={(id) => setSelectedSiteId(id)}
                />
              )}
            </section>

            <section className="h-full min-h-0 overflow-y-auto p-6 md:p-8">
              {tab === 'europe' && (
                <>
                  {selectedSiteId ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl text-paper">Selected Waterway</h2>
                        <button
                          onClick={() => setSelectedSiteId(null)}
                          className="text-xs font-mono text-paper/40 hover:text-paper"
                        >
                          ← back to reading form
                        </button>
                      </div>
                      <StationTrendPanel siteId={selectedSiteId} />
                    </>
                  ) : (
                    <>
                      <h2 className="font-display text-2xl text-paper mb-1">Assess a reading</h2>
                      <p className="text-paper/40 text-sm mb-5">
                        Enter measured or citizen-collected parameters for one point in time - or click
                        a station on the map to see its real multi-year trend and early-warning status.
                      </p>
                      <ReadingForm onResult={(r, p) => { setResult(r); setLastPayload(r ? p : null) }} />
                      <div className="mt-6">
                        <ResultPanel result={result} />
                        <ComplianceMini readings={lastPayload} />
                      </div>
                    </>
                  )}
                </>
              )}

              {tab === 'bangladesh' && (
                <>
                  <h2 className="font-display text-xl text-paper mb-1">Bangladesh Demo</h2>
                  <p className="text-paper/40 text-sm mb-5">
                    Real single-point field observations from the Buriganga and Turag rivers, scored by
                    the EU-trained model, with a deterministic early-warning simulation.
                  </p>
                  <BangladeshPanel />
                </>
              )}
            </section>
          </main>
        )}

        {tab === 'priority' && (
          <main className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full p-6 md:p-10">
              <h2 className="font-display text-xl text-paper mb-1">Inspection Priority</h2>
              <p className="text-paper/40 text-sm mb-5">
                A transparent, ranked shortlist for resource-constrained agencies deciding where to send
                an inspector first - combining current severity, early-warning state, forecast escalation,
                and data recency. Click any station to open its full trend and forecast.
              </p>
              <PriorityPanel onSelectStation={goToStation} />
            </div>
          </main>
        )}

        {tab === 'methodology' && (
          <main className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full p-6 md:p-10">
              <ProvenancePanel />
            </div>
          </main>
        )}
      </div>

      <footer className="border-t border-ink-700/60 px-6 py-3 md:px-10 text-paper/30 text-[11px] font-mono flex flex-wrap justify-between gap-2 shrink-0">
        <span>RandomForest + SHAP on EEA Waterbase · Bangladesh: DoE 2021-23, REACH-Dhaka 2017-21 (4,106 station-months)</span>
        <span>Screening tool only - not a substitute for laboratory testing or regulatory assessment</span>
      </footer>
    </div>
  )
}
