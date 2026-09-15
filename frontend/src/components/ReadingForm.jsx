import { useState } from 'react'

const FIELDS = [
  { key: 'pH', label: 'pH', unit: '', placeholder: '7.2' },
  { key: 'Dissolved oxygen', label: 'Dissolved Oxygen', unit: 'mg/L', placeholder: '8.5' },
  { key: 'BOD5', label: 'BOD₅', unit: 'mg/L', placeholder: '2.5' },
  { key: 'Ammonium', label: 'Ammonium', unit: 'mg/L', placeholder: '0.1' },
  { key: 'Nitrate', label: 'Nitrate', unit: 'mg/L', placeholder: '5.0' },
  { key: 'Nitrite', label: 'Nitrite', unit: 'mg/L', placeholder: '0.05' },
  { key: 'Total phosphorus', label: 'Total Phosphorus', unit: 'mg/L', placeholder: '0.08' },
  { key: 'Water temperature', label: 'Water Temp', unit: '°C', placeholder: '15' },
  { key: 'Electrical conductivity', label: 'Conductivity', unit: 'µS/cm', placeholder: '400' },
]

const SAMPLES = {
  'Clean EU river (typical)': {
    'pH': 7.9, 'Dissolved oxygen': 9.6, 'BOD5': 1.6, 'Ammonium': 0.05,
    'Nitrate': 2.8, 'Nitrite': 0.03, 'Total phosphorus': 0.05,
    'Water temperature': 13, 'Electrical conductivity': 350,
  },
  'Buriganga River, Dhaka (Hazaribagh)': {
    'pH': 6.8, 'Dissolved oxygen': 2.0, 'BOD5': 87.5,
    'Water temperature': 28, 'Electrical conductivity': 900,
  },
  'Turag River, Dhaka (confluence)': {
    'pH': 7.0, 'Dissolved oxygen': 1.85, 'BOD5': 140,
    'Water temperature': 29, 'Electrical conductivity': 750,
  },
}

export default function ReadingForm({ onResult }) {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const update = (key, val) => setValues((v) => ({ ...v, [key]: val }))

  const loadSample = (name) => {
    setValues(SAMPLES[name])
    setErr(null)
  }

  const clearForm = () => {
    setValues({})
    onResult(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const payload = {}
      FIELDS.forEach(({ key }) => {
        if (values[key] !== undefined && values[key] !== '') {
          payload[key] = parseFloat(values[key])
        }
      })
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Prediction failed')
      const data = await res.json()
      onResult(data)
    } catch (e) {
      setErr(e.message)
      onResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-paper/50 text-xs font-mono mb-2">quick samples</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(SAMPLES).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => loadSample(name)}
              className="text-xs font-mono border border-ink-700 text-paper/70 px-2.5 py-1 rounded hover:border-amber-500 hover:text-amber-400 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FIELDS.map(({ key, label, unit, placeholder }) => (
          <label key={key} className="block">
            <span className="text-paper/50 text-[11px] font-mono block mb-1">
              {label} {unit && <span className="text-paper/30">({unit})</span>}
            </span>
            <input
              type="number"
              step="any"
              value={values[key] ?? ''}
              onChange={(e) => update(key, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-ink-950 border border-ink-700 rounded px-2.5 py-1.5 text-paper font-mono text-sm focus:outline-none focus:border-amber-500 placeholder:text-paper/20"
            />
          </label>
        ))}

        <div className="col-span-2 sm:col-span-3 flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 font-medium rounded px-4 py-2.5 transition-colors"
          >
            {loading ? 'Assessing…' : 'Predict Risk'}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2.5 border border-ink-700 text-paper/60 rounded hover:text-paper transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {err && <p className="text-coral-400 text-sm mt-3 font-mono">{err}</p>}

      <p className="text-paper/30 text-xs mt-4 leading-relaxed">
        Leave any field blank - the model will estimate it from typical values and
        flag it as an assumption in the result.
      </p>
    </div>
  )
}
