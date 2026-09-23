const BASE = '/api'

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${path}`)
  }
  return res.json()
}

async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error || `Request failed: ${path}`)
  }
  return res.json()
}

export const api = {
  health: () => getJSON('/health'),
  stations: () => getJSON('/stations'),
  stationHistory: (siteId) => getJSON(`/station/${encodeURIComponent(siteId)}/history`),
  stationForecast: (siteId) => getJSON(`/station/${encodeURIComponent(siteId)}/forecast`),
  priority: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return getJSON(`/priority${qs ? `?${qs}` : ''}`)
  },
  predict: (payload) => postJSON('/predict', payload),
  defaults: () => getJSON('/defaults'),
  bangladeshSites: () => getJSON('/bangladesh/sites'),
  bangladeshHistory: (river) => getJSON(`/bangladesh/history/${encodeURIComponent(river)}`),
  bangladeshDemo: (siteKey) => getJSON(`/bangladesh/demo/${encodeURIComponent(siteKey)}`),
  crossRegionEval: () => getJSON('/cross_region_eval'),
  bangladeshDoeEval: () => getJSON('/bangladesh/doe_eval'),
  bangladeshDoeRivers: () => getJSON('/bangladesh/doe/rivers'),
  overview: () => getJSON('/overview'),
  context: () => getJSON('/context/national_scale_and_climate'),
  standards: () => getJSON('/standards/ecr2023'),
  compliance: (readings) => postJSON('/compliance', readings),
  assessability: () => getJSON('/assessability'),
  masterSummary: () => getJSON('/master/summary'),
  reachPoints: () => getJSON('/reach/points'),
  masterRiver: (river, param) => getJSON(`/master/river/${encodeURIComponent(river)}?param=${encodeURIComponent(param)}`),
  provenance: () => getJSON('/provenance'),
  modelCard: () => getJSON('/model_card'),
  citizenReports: () => getJSON('/citizen_reports'),
  submitCitizenReport: (payload) => postJSON('/citizen_reports', payload),
}
