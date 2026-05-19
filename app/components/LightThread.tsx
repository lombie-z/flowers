'use client'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '@/app/lib/scrollState'

const SECTION_COLORS = [
  new THREE.Color('#FFB74D'),
  new THREE.Color('#4DD0E1'),
  new THREE.Color('#F48FB1'),
  new THREE.Color('#FF8A65'),
  new THREE.Color('#B39DDB'),
]

function getSectionColor(offset: number, target: THREE.Color) {
  const raw = offset * 5
  const idx = Math.max(0, Math.min(Math.floor(raw), 4))
  const nextIdx = Math.min(idx + 1, 4)
  const t = raw - idx
  target.copy(SECTION_COLORS[idx]).lerp(SECTION_COLORS[nextIdx], t)
}

function generateCurve() {
  const points: THREE.Vector3[] = []
  const scale = 0.8

  // ── Lead-in: starts far off-screen, sweeps toward arrows ──
  points.push(new THREE.Vector3(15 * scale, -3 * scale, 10))
  points.push(new THREE.Vector3(12 * scale, -2 * scale, 6))
  points.push(new THREE.Vector3(8 * scale, -0.5 * scale, 2))
  points.push(new THREE.Vector3(4 * scale, 0.2 * scale, -2))
  points.push(new THREE.Vector3(1 * scale, 0.15 * scale, -5))
  points.push(new THREE.Vector3(-0.3 * scale, 0.1 * scale, -7.5))

  // ── Part 1: Two forward-pointing chevrons in XZ plane (Z ≈ -9 to -14) ──
  const s = scale

  // Arrow 1: V pointing along -Z
  // Left arm
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -9.0))
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -9.01))
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -9.02))
  points.push(new THREE.Vector3(-0.45 * s, 0.04 * s, -9.5))
  points.push(new THREE.Vector3(-0.2 * s, 0.02 * s, -10.0))
  // Tip cluster
  points.push(new THREE.Vector3(0, 0, -10.5))
  points.push(new THREE.Vector3(0, 0, -10.51))
  points.push(new THREE.Vector3(0, 0, -10.52))
  points.push(new THREE.Vector3(0, 0, -10.51))
  points.push(new THREE.Vector3(0, 0, -10.5))
  // Right arm
  points.push(new THREE.Vector3(0.2 * s, -0.02 * s, -10.0))
  points.push(new THREE.Vector3(0.45 * s, -0.04 * s, -9.5))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -9.02))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -9.01))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -9.0))

  // Connecting loop: sweep back from right to left for arrow 2
  points.push(new THREE.Vector3(0.5 * s, 0, -9.8))
  points.push(new THREE.Vector3(0.2 * s, 0.05 * s, -10.3))
  points.push(new THREE.Vector3(-0.1 * s, 0.08 * s, -10.8))
  points.push(new THREE.Vector3(-0.4 * s, 0.06 * s, -11.3))

  // Arrow 2: V pointing along -Z
  // Left arm
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -11.8))
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -11.81))
  points.push(new THREE.Vector3(-0.65 * s, 0.08 * s, -11.82))
  points.push(new THREE.Vector3(-0.45 * s, 0.04 * s, -12.3))
  points.push(new THREE.Vector3(-0.2 * s, 0.02 * s, -12.8))
  // Tip cluster
  points.push(new THREE.Vector3(0, 0, -13.3))
  points.push(new THREE.Vector3(0, 0, -13.31))
  points.push(new THREE.Vector3(0, 0, -13.32))
  points.push(new THREE.Vector3(0, 0, -13.31))
  points.push(new THREE.Vector3(0, 0, -13.3))
  // Right arm
  points.push(new THREE.Vector3(0.2 * s, -0.02 * s, -12.8))
  points.push(new THREE.Vector3(0.45 * s, -0.04 * s, -12.3))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -11.82))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -11.81))
  points.push(new THREE.Vector3(0.65 * s, -0.08 * s, -11.8))

  // Exit: trail forward into blend zone
  points.push(new THREE.Vector3(0.4 * s, -0.05 * s, -12.5))
  points.push(new THREE.Vector3(0.1 * s, -0.1 * s, -13.5))
  points.push(new THREE.Vector3(0, -0.15 * s, -14.5))

  // ── Blend zone: transition from arrows to organic path ──
  const lastArrowPt = points[points.length - 1]
  const blendCount = 30
  for (let i = 1; i <= blendCount; i++) {
    const t = i / blendCount
    const ease = t * t * (3 - 2 * t)

    const z = -14.5 - t * 2.5

    const tOrg = -z / 80
    const endT = Math.max(0, (tOrg - 0.85) / 0.15)
    const dropOff = endT * endT * 15
    const orgX =
      3.5 * Math.sin(tOrg * Math.PI * 6) +
      1.5 * Math.sin(tOrg * Math.PI * 3 + 0.7) +
      1.0 * Math.cos(tOrg * Math.PI * 10 + 2.0)
    const orgY =
      2.8 * Math.cos(tOrg * Math.PI * 5 + 1.0) +
      1.3 * Math.sin(tOrg * Math.PI * 8 + 0.3) +
      0.7 * Math.sin(tOrg * Math.PI * 14 + 1.5) -
      dropOff

    const x = THREE.MathUtils.lerp(lastArrowPt.x, orgX, ease)
    const y = THREE.MathUtils.lerp(lastArrowPt.y, orgY, ease)
    points.push(new THREE.Vector3(x, y, z))
  }

  // ── Part 2: Organic harmonic path (Z = -17 to Z = -80) ──
  const organicCount = 300
  for (let i = 0; i < organicCount; i++) {
    const z = -17.0 - (i / (organicCount - 1)) * 63 // Z from -17 to -80
    const t = -z / 80

    const endT = Math.max(0, (t - 0.85) / 0.15)
    const dropOff = endT * endT * 15

    const x =
      3.5 * Math.sin(t * Math.PI * 6) +
      1.5 * Math.sin(t * Math.PI * 3 + 0.7) +
      1.0 * Math.cos(t * Math.PI * 10 + 2.0)

    const y =
      2.8 * Math.cos(t * Math.PI * 5 + 1.0) +
      1.3 * Math.sin(t * Math.PI * 8 + 0.3) +
      0.7 * Math.sin(t * Math.PI * 14 + 1.5) -
      dropOff

    points.push(new THREE.Vector3(x, y, z))
  }

  return new THREE.CatmullRomCurve3(points)
}

const vertexShader = /* glsl */ `
  uniform float uBeatPulse;
  uniform float uTime;
  varying float vWorldZ;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Jagged displacement on beat — high-frequency sine spikes
    float jag = uBeatPulse * sin(pos.z * 25.0 + uTime * 8.0) * 0.1;
    pos.x += jag;
    pos.y += jag * 0.6;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldZ = worldPos.z;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uCameraZ;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPlaying;
  uniform float uStartup;
  uniform float uBeatPulse;

  varying float vWorldZ;
  varying vec2 vUv;

  void main() {
    float ahead = vWorldZ - uCameraZ;

    // Grow-pulse: leading edge breathes forward
    float growPulse = sin(uTime * 0.35) * 1.5;

    // Thread gradually slows through second half — camera overtakes near end
    float endFactor = smoothstep(-30.0, -76.0, uCameraZ);
    float baseFront = mix(-20.0, -6.0, endFactor * endFactor);
    float frontDist = baseFront * uStartup;
    float frontEdge = frontDist + growPulse * (1.0 - endFactor) * uStartup;

    // Reveal zone
    float revealFade = smoothstep(frontEdge - 2.0, frontEdge + 3.0, ahead)
                     * (1.0 - smoothstep(-1.0, 4.0, ahead));

    // Fade at geometry end so it doesn't clip
    float geoEndFade = smoothstep(-80.0, -76.0, vWorldZ);

    // Radial glow — soft gaussian tube edge
    float radial = exp(-pow(abs(vUv.y - 0.5) * 2.0, 2.0) * 2.0);

    // Leading-edge shimmer
    float nearFront = 1.0 - smoothstep(frontEdge, frontEdge + 6.0, ahead);
    float shimmer = 1.0 + nearFront * sin(uTime * 5.0 + vWorldZ * 3.0) * 0.35;

    // Music pulse — gentle travelling wave when playing
    float pulse = 1.0 + uPlaying * sin(uTime * 3.0 + vWorldZ * 1.2) * 0.25;

    float beatFlash = 1.0 + uBeatPulse * 0.8;

    float alpha = revealFade * radial * shimmer * pulse * geoEndFade * 1.0 * beatFlash;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(uColor * 2.5 * beatFlash, alpha);
  }
`

export function LightThread() {
  const tmpColor = useMemo(() => new THREE.Color(), [])

  const { geometry, material } = useMemo(() => {
    const curve = generateCurve()
    const geo = new THREE.TubeGeometry(curve, 800, 0.05, 8, false)

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCameraZ: { value: 0 },
        uColor: { value: new THREE.Color('#FFB74D') },
        uTime: { value: 0 },
        uPlaying: { value: 0 },
        uStartup: { value: 0 },
        uBeatPulse: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    return { geometry: geo, material: mat }
  }, [])

  useFrame((state, delta) => {
    const u = material.uniforms
    u.uCameraZ.value = state.camera.position.z
    u.uTime.value += delta

    if (u.uTime.value > 1.0) {
      const rate = 0.005 + u.uStartup.value * 0.025
      u.uStartup.value = THREE.MathUtils.lerp(u.uStartup.value, 1.0, rate)
    }

    u.uPlaying.value = THREE.MathUtils.lerp(
      u.uPlaying.value,
      scrollState.isPlaying ? 1.0 : 0.0,
      0.05,
    )

    u.uBeatPulse.value = scrollState.beatPulse

    getSectionColor(scrollState.offset, tmpColor)
    u.uColor.value.lerp(tmpColor, 0.06)
  })

  return (
    <group>
      <mesh geometry={geometry} material={material} />
    </group>
  )
}
