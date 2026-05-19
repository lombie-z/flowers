'use client'
import { useRef, useEffect } from 'react'
import { scrollState } from '@/app/lib/scrollState'

export function RozsaText() {
  const ref = useRef<HTMLDivElement>(null)

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
      <h1 className="rozsa-text">ROZSA</h1>
    </div>
  )
}
