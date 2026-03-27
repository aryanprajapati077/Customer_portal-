"use client"

import { useEffect, useState, useRef } from "react"

// but for now we keep the structure ready for real DB data
const chartData = [
  { month: "Jan", collected: 180, recycled: 165 },
  { month: "Feb", collected: 220, recycled: 200 },
  { month: "Mar", collected: 280, recycled: 255 },
  { month: "Apr", collected: 320, recycled: 295 },
  { month: "May", collected: 380, recycled: 350 },
  { month: "Jun", collected: 420, recycled: 385 },
  { month: "Jul", collected: 480, recycled: 445 },
  { month: "Aug", collected: 520, recycled: 480 },
  { month: "Sep", collected: 580, recycled: 540 },
  { month: "Oct", collected: 620, recycled: 575 },
  { month: "Nov", collected: 680, recycled: 630 },
  { month: "Dec", collected: 750, recycled: 695 },
]

const maxValue = Math.max(...chartData.map((d) => Math.max(d.collected, d.recycled)))

export function ImpactChart() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 },
    )

    if (chartRef.current) {
      observer.observe(chartRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={chartRef} className="relative h-64 sm:h-80 lg:h-96">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 sm:bottom-8 w-8 sm:w-12 flex flex-col justify-between text-[10px] sm:text-xs text-muted-foreground">
        <span>800</span>
        <span>600</span>
        <span>400</span>
        <span>200</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-10 sm:ml-14 h-full flex items-end gap-1 sm:gap-2 pb-6 sm:pb-8">
        {chartData.map((data, index) => (
          <div
            key={data.month}
            className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip */}
            {hoveredIndex === index && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 glass-strong px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg z-10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] sm:text-xs font-semibold text-foreground">{data.month}</p>
                <p className="text-[10px] sm:text-xs text-primary">Collected: {data.collected}t</p>
                <p className="text-[10px] sm:text-xs text-secondary">Recycled: {data.recycled}t</p>
              </div>
            )}

            {/* Bars container */}
            <div className="w-full flex gap-0.5 items-end h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)]">
              {/* Collected bar */}
              <div
                className="flex-1 bg-primary/80 rounded-t-sm transition-all duration-700 ease-out hover:bg-primary"
                style={{
                  height: isVisible ? `${(data.collected / maxValue) * 100}%` : "0%",
                  transitionDelay: `${index * 50}ms`,
                }}
              />
              {/* Recycled bar */}
              <div
                className="flex-1 bg-secondary/80 rounded-t-sm transition-all duration-700 ease-out hover:bg-secondary"
                style={{
                  height: isVisible ? `${(data.recycled / maxValue) * 100}%` : "0%",
                  transitionDelay: `${index * 50 + 25}ms`,
                }}
              />
            </div>

            {/* X-axis label */}
            <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">{data.month}</span>
          </div>
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute left-10 sm:left-14 right-0 top-0 bottom-6 sm:bottom-8 pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-border/30" style={{ top: `${i * 25}%` }} />
        ))}
      </div>
    </div>
  )
}
