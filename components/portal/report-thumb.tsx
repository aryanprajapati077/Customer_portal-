"use client"

/** Dynamic ESG report thumbnail — month/year update with the report period */

export function ReportThumb({
  monthLabel,
  year,
  className,
}: {
  monthLabel: string
  year: number | string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 184 236"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Monthly ESG Impact Report – ${monthLabel} ${year}`}
    >
      <rect width="184" height="236" rx="10" fill="#F7F9F6" />
      <rect x="1" y="1" width="182" height="234" rx="9" fill="none" stroke="#E5E5E5" />
      <circle cx="28" cy="28" r="10" fill="#1B7339" />
      <text x="44" y="33" fill="#1A1A1A" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="700">
        BuffIndia
      </text>
      <text x="16" y="72" fill="#1B7339" fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="800">
        Monthly ESG
      </text>
      <text x="16" y="90" fill="#1B7339" fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="800">
        Impact Report
      </text>
      <text x="16" y="112" fill="#1A1A1A" fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="700">
        – {monthLabel} {year}
      </text>
      {[128, 142, 156, 170].map((y) => (
        <rect key={y} x="16" y={y} width={y === 156 ? 90 : 120} height="6" rx="3" fill="#DDE5DC" />
      ))}
      <ellipse cx="148" cy="200" rx="22" ry="14" fill="#C8E6C9" />
      <path d="M140 198c4-8 10-10 14-4 2 4-2 10-8 12-4-2-6-4-6-8z" fill="#2E7D32" />
    </svg>
  )
}

export function reportPeriodFromDate(input?: string | Date | null): {
  monthLabel: string
  monthShort: string
  year: number
  dateLabel: string
} {
  const d = input ? new Date(input) : new Date()
  const safe = Number.isNaN(d.getTime()) ? new Date() : d
  const monthLabel = safe.toLocaleString("en-US", { month: "long" })
  const monthShort = safe.toLocaleString("en-US", { month: "short" })
  const year = safe.getFullYear()
  const day = String(safe.getDate()).padStart(2, "0")
  return {
    monthLabel,
    monthShort,
    year,
    dateLabel: `${day} ${monthShort} ${year}`,
  }
}
