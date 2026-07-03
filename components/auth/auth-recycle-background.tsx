"use client"

import { useMemo } from "react"

function CigaretteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="2" width="12" height="18" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="8" y="2" width="8" height="4" fill="currentColor" />
      <circle cx="12" cy="21" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export function AuthRecycleBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: (i * 12 + 5) % 100,
        delay: i * 1.5,
        duration: 14 + (i % 4) * 3,
        size: 18 + (i % 3) * 8,
      })),
    [],
  )

  return (
    <>
      <style jsx global>{`
        @keyframes auth-float-up {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute opacity-20 text-primary"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animation: `auth-float-up ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <CigaretteIcon className="w-full h-full" />
          </div>
        ))}
      </div>
    </>
  )
}
