export default function Header({ onReportClick }) {
  return (
    <header className="border-b border-ink-700/60 px-6 md:px-10 py-4 flex items-center justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h1 className="font-display text-2xl text-paper tracking-tight leading-none">AquaSentinel</h1>
          <span className="text-paper/30 text-xs font-mono hidden sm:inline">OneAquaHealth IEEE Hackathon</span>
        </div>
        <p className="text-sage-400 text-xs md:text-sm mt-1 truncate">
          Predictive early-warning for urban stream health
        </p>
      </div>

      <button
        onClick={onReportClick}
        className="shrink-0 px-3 py-2 text-xs font-mono rounded border border-ink-700 text-paper/70 hover:border-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap"
      >
        Report Local Water
      </button>
    </header>
  )
}
