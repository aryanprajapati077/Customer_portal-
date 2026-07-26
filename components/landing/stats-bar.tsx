const STATS = [
  { value: "86.4M+", label: "Cigarette butts diverted" },
  { value: "8.6B+", label: "Litres of water pollution prevented" },
  { value: "85+", label: "Cities across India" },
]

export function LandingStatsBar() {
  return (
    <section id="impact" className="scroll-mt-24 border-y border-black/5 bg-white/60 py-14 sm:py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 sm:grid-cols-3 sm:gap-8 sm:px-6 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-[family-name:var(--font-display)] text-[2.15rem] tracking-tight text-[#1B7339] sm:text-[2.5rem]">
              {s.value}
            </p>
            <p className="mx-auto mt-1.5 max-w-[14rem] text-[13px] leading-snug text-[#5A5A5A] sm:text-[14px]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
