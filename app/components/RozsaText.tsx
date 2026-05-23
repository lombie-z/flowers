'use client'
import { useRef, useEffect } from 'react'
import { scrollState } from '@/app/lib/scrollState'

export function RozsaText() {
  const ref = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLImageElement>(null)
  const matchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    function tick() {
      if (ref.current) {
        const t = Math.max(0, Math.min(1, (scrollState.offset - 0.68) / 0.32))
        const scale = 0.03 + 0.97 * t * t
        const fadeT = Math.max(0, Math.min(1, (scrollState.offset - 0.78) / 0.15))
        const opacity = fadeT * fadeT
        ref.current.style.opacity = String(opacity)
        ref.current.style.transform = `scale(${scale})`
      }
      if (coverRef.current) {
        // Cover: fades in at 92%, then falls to top-left of card from 94-99%
        const fadeIn = Math.max(0, Math.min(1, (scrollState.offset - 0.92) / 0.03))
        const fallT = Math.max(0, Math.min(1, (scrollState.offset - 0.94) / 0.05))
        const eased = fallT * fallT * (3 - 2 * fallT)

        const startY = -60
        const endY = -10
        const startX = 20
        const endX = -80
        const startRot = 0
        const endRot = -12

        const y = startY + (endY - startY) * eased
        const x = startX + (endX - startX) * eased
        const rot = startRot + (endRot - startRot) * eased

        coverRef.current.style.opacity = String(fadeIn)
        coverRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`
      }
      if (matchRef.current) {
        // Match fades in after cover has landed (96-99%)
        const matchFade = Math.max(0, Math.min(1, (scrollState.offset - 0.96) / 0.03))
        matchRef.current.style.opacity = String(matchFade)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div className="rozsa-fur-card">
          <div className="rozsa-fur-texture" />
          <h1 className="rozsa-title">rozsa</h1>
        </div>
        {/* Cover image that falls onto top-left corner */}
        <img
          ref={coverRef}
          src="/good-talk-cover.png"
          alt="Good Talk"
          style={{
            position: 'absolute',
            top: -30,
            left: -40,
            width: 140,
            height: 'auto',
            opacity: 0,
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
        {/* Matchstick sitting diagonally on top */}
        <div
          ref={matchRef}
          style={{
            position: 'absolute',
            top: -45,
            left: 10,
            width: 120,
            height: 20,
            zIndex: 4,
            opacity: 0,
            transform: 'rotate(-25deg)',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 120 20" width="120" height="20" style={{ overflow: 'visible' }}>
            {/* Stick */}
            <rect x="20" y="7" width="95" height="5" rx="2" fill="#c4956a" />
            <rect x="20" y="7" width="95" height="2.5" rx="1" fill="#d4a57a" opacity="0.5" />
            {/* Match head */}
            <ellipse cx="18" cy="10" rx="10" ry="7" fill="#4a1a1a" />
            <ellipse cx="16" cy="9" rx="7" ry="5" fill="#7a2020" />
            {/* Glow */}
            <ellipse cx="16" cy="9" rx="14" ry="12" fill="url(#match-glow)" />
            <defs>
              <radialGradient id="match-glow">
                <stop offset="0%" stopColor="#ff6030" stopOpacity="0.6">
                  <animate attributeName="stopOpacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="40%" stopColor="#ff4010" stopOpacity="0.2">
                  <animate attributeName="stopOpacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#ff2000" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  )
}
