'use client'
import { useRef, useEffect } from 'react'
import { scrollState } from '@/app/lib/scrollState'

export function RozsaText() {
  const ref = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLImageElement>(null)

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
      <div className="rozsa-fur-card" style={{ position: 'relative' }}>
        <div className="rozsa-fur-texture" />
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
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <h1 className="rozsa-title">rozsa</h1>
      </div>
    </div>
  )
}
