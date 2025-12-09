import * as THREE from 'three'

// CONFIG
const VINE_HEIGHT = 50
const VINE_RADIUS = 2
const TURNS = 5

// 1. REDUCE COUNT HERE
export const FLOWER_COUNT = 200 // Reduced from 800

export const vineCurve = new THREE.CatmullRomCurve3(
  new Array(100).fill(0).map((_, i) => {
    const t = i / 100 
    const angle = t * Math.PI * 2 * TURNS
    const currentRadius = VINE_RADIUS + Math.sin(t * 20) * 0.5
    const x = Math.cos(angle) * currentRadius
    const z = Math.sin(angle) * currentRadius
    const y = t * VINE_HEIGHT
    return new THREE.Vector3(x, y, z)
  })
)

export function generateVineData(count: number, stemThickness: number = 0.2) {
  const particles = []
  const randoms = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const pointOnCurve = vineCurve.getPointAt(t)
    const tangent = vineCurve.getTangentAt(t).normalize()
    
    // Calculate Normal (Direction pointing out from stem)
    const up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(tangent.dot(up)) > 0.9) up.set(0, 0, 1)
    const axis = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const angleAroundStem = Math.random() * Math.PI * 2
    const normal = axis.applyAxisAngle(tangent, angleAroundStem)
    
    // Position
    const position = pointOnCurve.clone().add(normal.multiplyScalar(stemThickness))
    
    // --- ORIENTATION FIX ---
    const dummy = new THREE.Object3D()
    dummy.position.copy(position)
    
    // Step 1: Look at the stem (this orients the Z-axis inwards)
    dummy.lookAt(pointOnCurve) 
    
    // Step 2: Flip 180 so Z-axis points OUTWARDS
    dummy.rotateY(Math.PI) 

    // Step 3: ADJUST THE ANGLE HERE
    // If your flowers look like they are facing the floor, change X
    // If they are facing sideways, change Z
    
    // Example: Tilt them 45 degrees UP towards the sky (Phototropism)
    dummy.rotateX(-Math.PI * 1.2) 

    // Example: Random wobble so they aren't perfect
    dummy.rotateZ((Math.random() - 0.5) * 0.5)
    dummy.rotateX((Math.random() - 0.5) * 0.2)

    const scale = 0.5 + Math.random() * 0.8
    
    particles.push({
      position,
      rotation: dummy.quaternion,
      scale
    })
    
    randoms[i] = Math.random()
  }
  
  return { particles, randomData: randoms }
}