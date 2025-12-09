'use client'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { vineCurve } from '@/app/lib/VineMath'

export function CameraRig() {
  const { camera } = useThree()
  const scroll = useScroll()

  useFrame(() => {
    // scroll.offset is 0 to 1
    const t = scroll.offset
    
    // 1. Get current target point on curve
    const point = vineCurve.getPointAt(t)
    
    // 2. Get tangent to calculate "behind" direction
    const tangent = vineCurve.getTangentAt(t).normalize()
    
    // 3. Camera Positioning
    // Move 6 units BACK along the tangent, and 2 units UP
    const camPos = point.clone()
      .sub(tangent.clone().multiplyScalar(6)) 
      .add(new THREE.Vector3(0, 2, 0))
    
    // Smoothly interpolate camera position
    camera.position.lerp(camPos, 0.1)
    
    // 4. Look At Logic
    // Look slightly ahead on the curve
    const lookAtT = Math.min(t + 0.1, 1)
    const lookAtPoint = vineCurve.getPointAt(lookAtT)
    
    camera.lookAt(lookAtPoint)
  })

  return null
}