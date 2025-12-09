import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

export function CameraRig() {
  const scroll = useScroll()

  useFrame((state) => {
    // The scroll.offset is a value between 0 and 1
    // We map 0-1 to a Z-axis position (e.g., 0 to -80)
    const targetZ = -scroll.offset * 80 
    
    // Smoothly interpolate current camera position to target
    // Use state.camera instead of hook's camera to avoid modification error
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1)
    
    // Optional: Add slight mouse parallax for extra "floaty" feel
    const { x, y } = state.pointer
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, x * 2, 0.1)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, y * 2, 0.1)
    
    state.camera.lookAt(0, 0, targetZ - 10) // Always look slightly ahead
  })

  return null
}