import { useState } from 'react'
import { api } from '../api'

export default function CitizenReportForm({ defaultLat, defaultLon, onSubmitted }) {
  const [lat, setLat] = useState(defaultLat)
  const [lon, setLon] = useState(defaultLon)
  const [waterColour, setWaterColour] = useState('')
  const [foam, setFoam] = useState(false)
  const [smell, setSmell] = useState(false)
  const [pollution, setPollution] = useState(false)
  const [freeText, setFreeText] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const report = await api.submitCitizenReport({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        water_colour: waterColour,
        foam_observed: foam,
        unusual_smell: smell,
        visible_pollution: pollution,
        free_text: freeText,
        has_photo: hasPhoto,
      })
      setDone(true)
      onSubmitted && onSubmitted(report)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="border border-sage-500/40 bg-sage-500/10 rounded p-4 text-sage-400 text-sm">
        ✓ Thanks - your observation was recorded as a{' '}
        <span className="font-mono">citizen observation</span> and added to the map as a supplementary
        contextual signal (not a lab measurement).
        <button
          onClick={() => setDone(false)}
          className="block mt-2 text-xs underline text-paper/50 hover:text-paper"
        >
          submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-paper/50 text-[11px] font-mono block mb-1">Latitude</span>
          <input
            type="number"
            step="any"
            required
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full bg-ink-950 border border-ink-700 rounded px-2.5 py-1.5 text-paper font-mono text-sm focus:outline-none focus:border-amber-500"
          />
        </label>
        <label className="block">
          <span className="text-paper/50 text-[11px] font-mono block mb-1">Longitude</span>
          <input
            type="number"
            step="any"
            required
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className="w-full bg-ink-950 border border-ink-700 rounded px-2.5 py-1.5 text-paper font-mono text-sm focus:outline-none focus:border-amber-500"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-paper/50 text-[11px] font-mono block mb-1">Water colour</span>
        <input
          type="text"
          value={waterColour}
          onChange={(e) => setWaterColour(e.target.value)}
          placeholder="e.g. dark grey, greenish, clear"
          className="w-full bg-ink-950 border border-ink-700 rounded px-2.5 py-1.5 text-paper text-sm focus:outline-none focus:border-amber-500 placeholder:text-paper/20"
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm text-paper/70">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={foam} onChange={(e) => setFoam(e.target.checked)} />
          Foam observed
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={smell} onChange={(e) => setSmell(e.target.checked)} />
          Unusual smell
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={pollution} onChange={(e) => setPollution(e.target.checked)} />
          Visible pollution
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} />
          I have a photo
        </label>
      </div>

      <label className="block">
        <span className="text-paper/50 text-[11px] font-mono block mb-1">Free-text observation</span>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          placeholder="What did you notice?"
          className="w-full bg-ink-950 border border-ink-700 rounded px-2.5 py-1.5 text-paper text-sm focus:outline-none focus:border-amber-500 placeholder:text-paper/20"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 font-medium rounded px-4 py-2.5 text-sm transition-colors"
      >
        {submitting ? 'Submitting…' : '📱 Report Local Water'}
      </button>

      {error && <p className="text-coral-400 text-xs font-mono">{error}</p>}

      <p className="text-paper/30 text-[11px] leading-relaxed">
        Citizen observations are supplementary contextual signals, not laboratory measurements. A photo
        is not converted into a chemical concentration.
      </p>
    </form>
  )
}
