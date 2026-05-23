'use client'
import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState } from '@/app/lib/scrollState'

const smokeVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const smokeFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;

    float n = noise(uv * 4.0 + vec2(uTime * 0.3, -uTime * 0.5));
    float n2 = noise(uv * 8.0 + vec2(-uTime * 0.2, -uTime * 0.8));

    float shape = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.4, uv.y);
    float xFade = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0);

    float smoke = shape * xFade * (n * 0.6 + n2 * 0.4);
    smoke *= 0.5;

    gl_FragColor = vec4(1.0, 1.0, 1.0, smoke);
  }
`

function SmokeEffect() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={[0, 1.5, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[2.0, 4.0]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={smokeVertexShader}
        fragmentShader={smokeFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

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
    <group
      rotation={[0, Math.PI / 2, 0.1]}
      scale={0.2}
      position={[-0.65, 0, 0]}
    >
      <mesh geometry={nodes['Node-Mesh'].geometry}>
        <meshStandardMaterial {...materials.lambert2SG} />
      </mesh>
      <mesh geometry={nodes['Node-Mesh_1'].geometry}>
        <meshStandardMaterial
          ref={headRef}
          {...materials.lambert3SG}
          emissive={new THREE.Color('#ff4500')}
          emissiveIntensity={1.2}
        />
      </mesh>
      <pointLight position={[0, 0, -1]} color="#ff4500" intensity={3} distance={5} />
      <SmokeEffect />
    </group>
  )
}

export function RozsaText() {
  const cardRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const matchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    function tick() {
      const offset = scrollState.offset

      // Card: zooms in
      if (cardRef.current) {
        const t = Math.max(0, Math.min(1, (offset - 0.68) / 0.32))
        const scale = 0.03 + 0.97 * t * t
        const fadeT = Math.max(0, Math.min(1, (offset - 0.78) / 0.15))
        const opacity = fadeT * fadeT
        cardRef.current.style.opacity = String(opacity)
        cardRef.current.style.transform = `scale(${scale})`
      }

      // Overlay (cover + matchstick): no scale, just fade
      if (overlayRef.current) {
        const show = offset > 0.94 ? 1 : 0
        overlayRef.current.style.visibility = show ? 'visible' : 'hidden'
      }

      // Cover: fades in at 95%, falls to position 96-100%
      if (coverRef.current) {
        const fadeIn = Math.max(0, Math.min(1, (offset - 0.95) / 0.02))
        const fallT = Math.max(0, Math.min(1, (offset - 0.96) / 0.04))
        const eased = fallT * fallT * (3 - 2 * fallT)

        const x = 20 + (-80 - 20) * eased
        const y = -60 + (-10 + 60) * eased
        const rot = -8 * eased
        const rotX = -8 * eased
        const rotY = 6 * eased

        coverRef.current.style.opacity = String(fadeIn)
        coverRef.current.style.transform = `perspective(400px) translate(${x}px, ${y}px) rotate(${rot}deg) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      }

      // Matchstick: fades in at 99-100%
      if (matchRef.current) {
        const matchFade = Math.max(0, Math.min(1, (offset - 0.99) / 0.01))
        matchRef.current.style.opacity = String(matchFade)
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <>
      {/* Rozsa card — scales/zooms in */}
      <div
        ref={cardRef}
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
        <div className="rozsa-fur-card">
          <div className="rozsa-fur-texture" />
          <h1 className="rozsa-title">rozsa</h1>
        </div>
      </div>

      {/* Cover + matchstick — no scale, positioned to overlap the card */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1,
          visibility: 'hidden',
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Invisible spacer matching fur card size */}
          <div style={{ padding: '40px 60px', visibility: 'hidden' }}>
            <span style={{ fontSize: 'clamp(3rem, 12vw, 8rem)' }}>rozsa</span>
          </div>

          {/* Cover image */}
          <div
            ref={coverRef}
            style={{
              position: 'absolute',
              top: -40,
              left: -50,
              width: 170,
              height: 170,
              opacity: 0,
              borderRadius: 4,
              boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
              zIndex: 3,
              pointerEvents: 'none',
              transformOrigin: 'top left',
              overflow: 'hidden',
            }}
          >
            <img
              src="/good-talk-cover.png"
              alt="Good Talk"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              mixBlendMode: 'screen',
              opacity: 0.8,
              pointerEvents: 'none',
            }}>
              <img
                src="/plastic-wrap.jpg"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* 3D Matchstick */}
          <div
            ref={matchRef}
            style={{
              position: 'absolute',
              top: -40,
              left: -30,
              width: 200,
              height: 50,
              zIndex: 4,
              opacity: 0,
              pointerEvents: 'none',
            }}
          >
            <Canvas camera={{ position: [0, 0, 2], fov: 16 }} gl={{ alpha: true }} style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 3, 2]} intensity={0.8} />
              <MatchstickModel />
            </Canvas>
          </div>
        </div>
      </div>
    </>
  )
}
