const CONF_STYLE = {
  HIGH: 'text-sage-400',
  MODERATE: 'text-amber-400',
  LOW: 'text-coral-400',
}

export default function DataCompleteness({ completeness, confidenceLabel, note }) {
  if (!completeness) return null
  const { measured, estimated, total } = completeness
  const pct = Math.round((measured / total) * 100)

  return (
    <div className="border border-ink-700 rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-paper/40 text-xs font-mono">data completeness</div>
        <div className={`text-xs font-mono font-semibold ${CONF_STYLE[confidenceLabel] || 'text-paper/60'}`}>
          confidence: {confidenceLabel}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-ink-950 rounded overflow-hidden flex">
          <div className="bg-sage-500 h-full" style={{ width: `${pct}%` }} />
          <div className="bg-amber-500/60 h-full" style={{ width: `${100 - pct}%` }} />
        </div>
        <span className="text-xs font-mono text-paper/60 whitespace-nowrap">
          {measured}/{total} measured
        </span>
      </div>

      <div className="flex gap-4 text-[11px] font-mono text-paper/50">
        <span><span className="text-sage-400">●</span> {measured} measured</span>
        <span><span className="text-amber-400">●</span> {estimated} estimated</span>
      </div>

      {note && (
        <p className="text-paper/40 text-[11px] leading-relaxed mt-3 border-t border-ink-700 pt-2">
          {note}
        </p>
      )}
    </div>
  )
}
