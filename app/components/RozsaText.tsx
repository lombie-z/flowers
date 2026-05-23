'use client'
import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState } from '@/app/lib/scrollState'

function MatchstickModel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes, materials } = useGLTF('/Matchstick.glb') as any
  const headRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    if (headRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5
      headRef.current.emissiveIntensity = 0.8 + pulse * 1.5
    }
  })

  return (
    <group rotation={[0, 0, -0.4]} scale={0.22} position={[0, 0.2, 0]}>
      {/* Stick */}
      <mesh geometry={nodes['Node-Mesh'].geometry}>
        <meshStandardMaterial {...materials.lambert2SG} />
      </mesh>
      {/* Head with glow */}
      <mesh geometry={nodes['Node-Mesh_1'].geometry}>
        <meshStandardMaterial
          ref={headRef}
          {...materials.lambert3SG}
          emissive={new THREE.Color('#ff4500')}
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Point light at the tip */}
      <pointLight position={[-1.8, 0, 0]} color="#ff4500" intensity={3} distance={4} />
    </group>
  )
}

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
        const endRot = -8
        const startRotX = 0
        const endRotX = -8
        const startRotY = 0
        const endRotY = 6

        const y = startY + (endY - startY) * eased
        const x = startX + (endX - startX) * eased
        const rot = startRot + (endRot - startRot) * eased
        const rotX = startRotX + (endRotX - startRotX) * eased
        const rotY = startRotY + (endRotY - startRotY) * eased

        coverRef.current.style.opacity = String(fadeIn)
        coverRef.current.style.transform = `perspective(400px) translate(${x}px, ${y}px) rotate(${rot}deg) rotateX(${rotX}deg) rotateY(${rotY}deg)`
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
            top: -40,
            left: -50,
            width: 170,
            height: 'auto',
            opacity: 0,
            borderRadius: 4,
            boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
            zIndex: 3,
            pointerEvents: 'none',
            transformOrigin: 'top left',
          }}
        />
        {/* 3D Matchstick with glowing tip */}
        <div
          ref={matchRef}
          style={{
            position: 'absolute',
            top: -55,
            left: -10,
            width: 160,
            height: 60,
            zIndex: 4,
            opacity: 0,
            transform: 'rotate(-20deg)',
            pointerEvents: 'none',
          }}
        >
          <Canvas camera={{ position: [0, 0, 3], fov: 35 }} gl={{ alpha: true }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 3, 2]} intensity={0.8} />
            <MatchstickModel />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
