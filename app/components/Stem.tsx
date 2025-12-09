'use client'
import { vineCurve } from '@/app/lib/VineMath'

export function Stem() {
  // Optional: Add a bark texture to /public/bark.jpg
  // If no texture, remove the useLoader and map prop
  // const texture = useLoader(THREE.TextureLoader, '/bark.jpg')
  // texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <mesh>
      {/* Curve, TubularSegments, Radius, RadialSegments, Closed 
      */}
      <tubeGeometry args={[vineCurve, 200, 0.2, 16, false]} />
      <meshStandardMaterial 
        color="#2e4c23" // Dark organic green
        roughness={0.8}
      />
    </mesh>
  )
}