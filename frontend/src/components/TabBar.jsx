import React from 'react'
import { Icon } from './ui'

export default function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="border-b border-ink-700/60 px-3 md:px-8 shrink-0 overflow-x-auto bg-ink-950/30" aria-label="Sections">
      <div className="max-w-6xl mx-auto w-full flex gap-1 min-w-max py-1.5">
        {tabs.map((t) => {
          const on = active === t.key
          return (
            <button key={t.key} onClick={() => onChange(t.key)} aria-current={on ? 'page' : undefined}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all ${on ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40' : 'text-paper/50 hover:text-paper/85 hover:bg-ink-800/60'}`}>
              <Icon name={t.icon} className="w-4 h-4" />{t.label}
              {t.badge && <span className="text-[9px] font-mono px-1.5 py-px rounded-full bg-amber-500/20 text-amber-400">{t.badge}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}