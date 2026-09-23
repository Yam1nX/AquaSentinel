const TONE = {
  non_compliant: { cls: 'border-coral-500/50 bg-coral-500/10 text-coral-400', txt: 'fails' },
  undetermined: { cls: 'border-amber-500/50 bg-amber-500/10 text-amber-400', txt: 'unknown' },
  compliant: { cls: 'border-sage-500/50 bg-sage-500/10 text-sage-400', txt: 'certified' },
}
export const CLASS_SHORT = {
  '1_drinking_source_disinfection_only': 'Drinking (disinf.)', '2_recreation': 'Recreation', '3_drinking_source_conventional': 'Drinking (treated)',
  '4_fisheries': 'Fisheries', '5_industrial_cooling': 'Industrial', '6_irrigation': 'Irrigation',
}
export default function VerdictChips({ classes }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {Object.entries(classes).map(([id, c]) => {
        const t = TONE[c.verdict]
        return (
          <div key={id} className={`rounded-lg border px-2.5 py-2 ${t.cls}`} title={c.failed.length ? `fails on: ${c.failed.join(', ')}` : c.unmeasured.length ? `not measured: ${c.unmeasured.join(', ')}` : 'all scheduled parameters measured and passed'}>
            <div className="text-[10px] font-mono uppercase tracking-wide opacity-80">{CLASS_SHORT[id]}</div>
            <div className="text-sm font-medium mt-0.5">{t.txt}{c.failed.length ? ` · ${c.failed.join(', ')}` : ''}</div>
          </div>
        )
      })}
    </div>
  )
}
