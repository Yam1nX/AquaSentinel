export default function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="border-b border-ink-700/60 px-6 md:px-10 shrink-0 overflow-x-auto">
      <div className="flex gap-6 min-w-max">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative py-3 text-sm font-mono whitespace-nowrap transition-colors ${
              active === t.key ? 'text-amber-400' : 'text-paper/45 hover:text-paper/75'
            }`}
          >
            {t.label}
            <span
              className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-opacity ${
                active === t.key ? 'bg-amber-500 opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        ))}
      </div>
    </nav>
  )
}
