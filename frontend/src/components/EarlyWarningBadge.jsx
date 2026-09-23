const STATE_STYLE = {
  NORMAL: { text: 'text-sage-400', bg: 'bg-sage-500/15', border: 'border-sage-500/40', icon: '●' },
  WATCH: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '◐' },
  WARNING: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/50', icon: '⚠' },
  CRITICAL: { text: 'text-coral-400', bg: 'bg-coral-500/15', border: 'border-coral-500/60', icon: '⚠' },
}

export default function EarlyWarningBadge({ state, reasons, compact = false }) {
  const style = STATE_STYLE[state] || STATE_STYLE.NORMAL

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[11px] ${style.text} ${style.bg} ${style.border}`}
      >
        {style.icon} {state}
      </span>
    )
  }

  return (
    <div className={`border rounded p-4 ${style.bg} ${style.border}`}>
      <div className={`flex items-center gap-2 font-display text-lg ${style.text}`}>
        <span>{style.icon}</span>
        <span>Early warning: {state}</span>
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs font-mono text-paper/70 leading-relaxed">
          {reasons.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
