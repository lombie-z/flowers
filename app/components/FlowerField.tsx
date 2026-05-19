import { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import { scrollState } from '@/app/lib/scrollState'

const COUNT = 400

// --- 1. DATA GENERATION (Unchanged) ---
function generateParticleData() {
  const data = []
  const randoms = new Float32Array(COUNT)
  
  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 20
    const y = (Math.random() - 0.5) * 20
    const r = Math.random()
    // Sparse early, dense after roses (section 2)
    let z: number
    if (r < 0.07) {
      z = -Math.random() * 32          // sections 0-1: very sparse
    } else if (r < 0.20) {
      z = -32 - Math.random() * 16     // section 2: building up
    } else {
      z = -48 - Math.random() * 32     // sections 3-4: dense
    }
    const scale = 0.5 + Math.random() * 0.5
    // Add random rotations for variety
    const rotationX = Math.random() * Math.PI * 2
    const rotationY = Math.random() * Math.PI * 2
    const rotationZ = Math.random() * Math.PI * 2
    
    data.push({ x, y, z, scale, rotationX, rotationY, rotationZ })
    randoms[i] = Math.random()
  }
  return { particles: data, randomData: randoms }
}

// --- 2. SHADER (Unchanged) ---
const vertexShader = `
  uniform float uTime;
  uniform float uBeatPulse;
  attribute float aRandom;

  void main() {
    float floatSpeed = 1.0;
    float floatHeight = 0.2;
    float yOffset = sin(uTime * floatSpeed + aRandom * 100.0) * floatHeight;
    csm_Position.y += yOffset;

    float beatScale = 1.0 + uBeatPulse * 0.2;
    csm_Position *= beatScale;
  }
`

export function FlowerField() {
  // We need an array of refs because we have 3 mesh parts
  const meshRefs = useRef<THREE.InstancedMesh[]>([])
  const materialRefs = useRef<THREE.ShaderMaterial[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes, materials } = useGLTF('/Flower.glb') as any;

  // --- 3. PREPARE GEOMETRY PARTS ---
  // We define the 3 parts of your hibiscus here based on your gltfjsx output
  const flowerParts = useMemo(() => {
    return [
      { id: 'petals', geometry: nodes['hibiscus_flower-Mesh'].geometry, material: materials.red },
      { id: 'pollen', geometry: nodes['hibiscus_flower-Mesh_1'].geometry, material: materials.hay },
      { id: 'stem',   geometry: nodes['hibiscus_flower-Mesh_2'].geometry, material: materials.tree },
    ]
  }, [nodes, materials])

  // Generate data once
  const { particles, randomData } = useMemo(() => generateParticleData(), [])

  // --- 4. EXTEND GEOMETRIES ---
  // We must clone EACH geometry and inject the 'aRandom' attribute into it
  const processedParts = useMemo(() => {
    return flowerParts.map((part) => {
      const geom = part.geometry.clone()
      geom.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randomData, 1))
      return { ...part, geometry: geom }
    })
  }, [flowerParts, randomData])

  // --- 5. SYNC MATRICES ---
  useLayoutEffect(() => {
    const tempObject = new THREE.Object3D()
    
    // Loop through every instanced mesh (petals, pollen, stem)
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return
      
      particles.forEach((data, i) => {
        tempObject.position.set(data.x, data.y, data.z)
        tempObject.rotation.set(data.rotationX, data.rotationY, data.rotationZ) // Random initial angles
        tempObject.scale.set(data.scale, data.scale, data.scale)
        tempObject.updateMatrix()
        mesh.setMatrixAt(i, tempObject.matrix)
      })
      
      mesh.instanceMatrix.needsUpdate = true
    })
  }, [particles])

  // --- 6. ANIMATION LOOP ---
  useFrame((state) => {
    materialRefs.current.forEach((mat) => {
      if (mat?.uniforms) {
        if (mat.uniforms.uTime) mat.uniforms.uTime.value = state.clock.elapsedTime
        if (mat.uniforms.uBeatPulse) mat.uniforms.uBeatPulse.value = scrollState.beatPulse
      }
    })
  })

  return (
    <group>
      {processedParts.map((part, index) => (
        <instancedMesh
          key={part.id}
          ref={(el) => (meshRefs.current[index] = el!)}
          args={[part.geometry, undefined, COUNT]}
          frustumCulled={false} // Prevents flickering at edges of screen
        >
          <CustomShaderMaterial
  ref={(el: any) => (materialRefs.current[index] = el!)}
  baseMaterial={THREE.MeshStandardMaterial}
  vertexShader={vertexShader}
  // 1. Keep uTime in uniforms
  uniforms={{
    uTime: { value: 0 },
    uBeatPulse: { value: 0 },
  }}
  // 2. PASS TEXTURES AS DIRECT PROPS
  // This tells Three.js: "Turn on texture mapping logic!"
  map={part.material.map} 
  
  // 3. Optional: If your flower has these maps, pass them too:
  // normalMap={part.material.normalMap}
  // roughnessMap={part.material.roughnessMap}
  // emissiveMap={part.material.emissiveMap}

  // 4. Standard Visual Settings
  color={part.material.color}
  roughness={part.material.roughness} 
  metalness={part.material.metalness}
  side={THREE.DoubleSide}
  transparent={true}
  alphaTest={0.5} // Crucial: Cuts out the transparent parts of the leaf cleanly
/>
        </instancedMesh>
      ))}
    </group>
  )
}