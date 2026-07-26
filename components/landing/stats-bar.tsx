const STATS = [
  { value: "1.2M+", label: "Cigarette butts diverted" },
  { value: "120M+", label: "Litres of water pollution prevented" },
  { value: "6,000+", label: "Tonnes CO₂ avoided" },
  { value: "85+", label: "Cities across India" },
]

export function LandingStatsBar() {
  return (
    <section id="impact" className="scroll-mt-24 border-y border-black/5 bg-white/60 py-14 sm:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center lg:text-left">
            <p className="font-[family-name:var(--font-display)] text-[2rem] tracking-tight text-[#1B7339] sm:text-[2.35rem]">
              {s.value}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[#5A5A5A]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
