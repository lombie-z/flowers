'use client'
import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Environment } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { FlowerField } from '@/app/components/FlowerField'
import { CameraRig } from '@/app/components/CameraRig'
import { SectionModels } from '@/app/components/SectionModels'
import { LightThread } from '@/app/components/LightThread'
import { MusicPlayer } from '@/app/components/MusicPlayer'
import { RozsaText } from '@/app/components/RozsaText'
import { scrollState } from '@/app/lib/scrollState'

type RGB = [number, number, number]

const GRADIENT_STOPS: { offset: number; top: RGB; bottom: RGB }[] = [
  { offset: 0.0,  top: [200, 195, 225], bottom: [215, 210, 235] },
  { offset: 0.08, top: [170, 198, 232], bottom: [190, 215, 242] },
  { offset: 0.35, top: [100, 160, 218], bottom: [130, 180, 232] },
  { offset: 0.58, top: [60, 130, 205],  bottom: [90, 155, 222] },
  { offset: 0.65, top: [120, 110, 180], bottom: [150, 100, 160] },
  { offset: 0.74, top: [225, 120, 65],  bottom: [210, 85, 110] },
  { offset: 0.82, top: [150, 50, 120],  bottom: [110, 30, 90] },
  { offset: 0.92, top: [40, 15, 65],    bottom: [22, 10, 40] },
  { offset: 1.0,  top: [13, 27, 42],    bottom: [10, 14, 26] },
]

function lerpRGB(a: RGB, b: RGB, t: number, boost: number = 0): string {
  return `rgb(${Math.min(255, Math.round(a[0] + (b[0] - a[0]) * t + boost))},${Math.min(255, Math.round(a[1] + (b[1] - a[1]) * t + boost))},${Math.min(255, Math.round(a[2] + (b[2] - a[2]) * t + boost))})`
}

function getBackground(offset: number, beatBoost: number = 0): string {
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    if (offset <= GRADIENT_STOPS[i + 1].offset) {
      const t = (offset - GRADIENT_STOPS[i].offset) / (GRADIENT_STOPS[i + 1].offset - GRADIENT_STOPS[i].offset)
      return `linear-gradient(to bottom, ${lerpRGB(GRADIENT_STOPS[i].top, GRADIENT_STOPS[i + 1].top, t, beatBoost)}, ${lerpRGB(GRADIENT_STOPS[i].bottom, GRADIENT_STOPS[i + 1].bottom, t, beatBoost)})`
    }
  }
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1]
  return `linear-gradient(to bottom, rgb(${last.top.join(',')}), rgb(${last.bottom.join(',')}))`
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    function tick() {
      if (containerRef.current) {
        const beatBoost = scrollState.beatPulse * 35
        containerRef.current.style.background = getBackground(scrollState.offset, beatBoost)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(to bottom, rgb(200,195,225), rgb(215,210,235))',
      }}
    >
      <Canvas camera={{ position: [0, 0, 0], fov: 50 }} style={{ position: 'relative', zIndex: 2 }}>
        <ambientLight intensity={0.5} />
        <Environment preset="sunset" />
        <ScrollControls pages={5} damping={0.2}>
          <CameraRig />
          <FlowerField />
          <LightThread />
          <Suspense fallback={null}>
            <SectionModels />
          </Suspense>
          <EffectComposer>
            <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
            <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.4} intensity={0.4} />
          </EffectComposer>
        </ScrollControls>
      </Canvas>
      <MusicPlayer />
      <RozsaText />
    </div>
  )
}