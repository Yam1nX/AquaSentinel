// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'

beforeAll(() => {
  const real = globalThis.fetch
  globalThis.fetch = (u, o) => real(typeof u === 'string' && u.startsWith('/') ? `http://127.0.0.1:5000${u}` : u, o)
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia || (() => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
})
const errors = []
const origErr = console.error
console.error = (...a) => { errors.push(a.map(String).join(' ').slice(0, 300)); }

async function page(Comp, needle, props = {}) {
  cleanup(); errors.length = 0
  render(<Comp {...props} />)
  await waitFor(() => expect(screen.getAllByText(needle).length).toBeGreaterThan(0), { timeout: 8000 })
  return errors.filter((e) => !/act\(|not wrapped|Leaflet|leaflet/.test(e))
}

describe('pages render against the live API', () => {
  it('Overview', async () => { const Comp = (await import('../src/pages/Overview.jsx')).default; const e = await page(Comp, /Four numbers/, { onNavigate() {} }); expect(e).toEqual([]) })
  it('Compliance', async () => { const Comp = (await import('../src/pages/Compliance.jsx')).default; const e = await page(Comp, /Three-valued compliance/); expect(e).toEqual([])
    await waitFor(() => expect(screen.getAllByText('verdict').length).toBeGreaterThan(0), { timeout: 8000 })
    fireEvent.click(screen.getByText('Fully measured clean stream'))
    await waitFor(() => expect(screen.getAllByText('certified').length).toBeGreaterThan(0), { timeout: 8000 }) })
  it('Evidence', async () => { const Comp = (await import('../src/pages/Evidence.jsx')).default; const e = await page(Comp, /What the numbers support/); expect(e).toEqual([]) })
  it('Observatory', async () => { const Comp = (await import('../src/pages/Observatory.jsx')).default; const e = await page(Comp, /Dhaka's rivers/); expect(e).toEqual([])
    await waitFor(() => expect(screen.getAllByText(/monthly median/).length).toBeGreaterThan(0), { timeout: 8000 }) })
  it('App shell + assess flow', async () => {
    const App = (await import('../src/App.jsx')).default; cleanup(); errors.length = 0
    render(<App />)
    await waitFor(() => expect(screen.getAllByText(/API live/).length).toBeGreaterThan(0), { timeout: 8000 })
    fireEvent.click(screen.getByText('Assess a reading'))
    await waitFor(() => expect(screen.getAllByText(/Assess a reading/).length).toBeGreaterThan(1), { timeout: 8000 })
  })
})

describe('result panel', () => {
  it('renders bounds, prior and neural opinion from a real /api/predict response', async () => {
    const ResultPanel = (await import('../src/components/ResultPanel.jsx')).default
    const ComplianceMini = (await import('../src/components/ComplianceMini.jsx')).default
    const body = { pH: 7.3, 'Dissolved oxygen': 1.5, BOD5: 12, 'Electrical conductivity': 700, region: 'dhaka_rivers' }
    const res = await (await fetch('/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
    cleanup(); errors.length = 0
    render(<><ResultPanel result={res} /><ComplianceMini readings={body} /></>)
    await waitFor(() => expect(screen.getAllByText(/neural second opinion/i).length).toBeGreaterThan(0))
    expect(screen.getAllByText(/regional estimate/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/provable bounds/i).length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getAllByText(/legal check/i).length).toBeGreaterThan(0), { timeout: 8000 })
    expect(errors.filter((e) => !/act\(|not wrapped|leaflet/i.test(e))).toEqual([])
  })
})
