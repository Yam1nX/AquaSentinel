import React, { useEffect, useState } from 'react'
import { api } from '../api'
import VerdictChips from './VerdictChips'

const MAP = ['pH', 'Dissolved oxygen', 'BOD5', 'Ammonium', 'Nitrate']
export default function ComplianceMini({ readings }) {
  const [res, setRes] = useState(null)
  useEffect(() => {
    if (!readings) { setRes(null); return }
    const r = Object.fromEntries(Object.entries(readings).filter(([k]) => MAP.includes(k)))
    api.compliance(r).then(setRes).catch(() => setRes(null))
  }, [readings])
  if (!res) return null
  return (
    <div className="card p-4 mt-4">
      <div className="eyebrow mb-1">legal check · Environment Conservation Rules 2023</div>
      <p className="text-paper/55 text-xs mb-3 leading-relaxed">{res.principle}</p>
      <VerdictChips classes={res.classes} />
    </div>
  )
}
