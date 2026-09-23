import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon } from './ui'

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8FD3E0" /><stop offset="1" stopColor="#5B8C72" /></linearGradient>
      </defs>
      <path d="M20 3s12 13 12 22a12 12 0 01-24 0C8 16 20 3 20 3z" fill="url(#lg)" opacity=".95" />
      <path d="M11 25h5l3-6 4 11 3-5h4" fill="none" stroke="#0B1F1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Header({ onReportClick }) {
  const [up, setUp] = useState(null)
  useEffect(() => { api.health().then(() => setUp(true)).catch(() => setUp(false)) }, [])
  return (
    <header className="border-b border-ink-700/60 px-5 md:px-10 py-3.5 flex items-center justify-between gap-4 shrink-0 bg-ink-950/60 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <Logo />
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-paper tracking-tight leading-none">AquaSentinel</h1>
          <p className="text-sky-300/80 text-[11px] md:text-xs mt-1 truncate font-mono">risk you can prove · even when the lab data is missing</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className={`hidden md:inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-1 rounded-full border ${up === false ? 'border-coral-500/40 text-coral-400' : 'border-sage-500/40 text-sage-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${up === false ? 'bg-coral-400' : 'bg-sage-400 animate-pulse'}`} />{up === false ? 'API offline' : up ? 'API live' : 'connecting'}
        </span>
        <span className="hidden lg:inline text-paper/30 text-[11px] font-mono">OneAquaHealth · IEEE · Track 6</span>
        <button onClick={onReportClick} className="px-3 py-2 text-xs font-mono rounded-lg border border-ink-700 text-paper/75 hover:border-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap inline-flex items-center gap-1.5">
          <Icon name="droplet" className="w-3.5 h-3.5" />Report local water
        </button>
      </div>
    </header>
  )
}
