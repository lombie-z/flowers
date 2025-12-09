'use client'
import { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import { generateVineData, FLOWER_COUNT } from '@/app/lib/VineMath'

// --- SHADER (Safe Mode) ---
const vertexShader = `
  uniform float uTime;
  attribute float aRandom;

  void main() {
    // Gentle floating based on time + random seed
    float floatSpeed = 2.0;
    float floatHeight = 0.1; 
    
    // Move Y local position (relative to flower center)
    float yOffset = sin(uTime * floatSpeed + aRandom * 50.0) * floatHeight;
    csm_Position.y += yOffset;
    
    // Slight breathing scale
    float scaleNoise = sin(uTime + aRandom * 10.0) * 0.05;
    csm_Position += csm_Position * scaleNoise;
  }
`

export function FlowerVine() {
  const meshRefs = useRef<THREE.InstancedMesh[]>([])
  const materialRefs = useRef<THREE.ShaderMaterial[]>([])
  
  // LOAD MODEL
  // Ensure your /public/Flower.glb exists
  const { nodes, materials } = useGLTF('/Flower.glb') as any

  // 1. Define Model Parts
  // Adjust these keys based on your specific GLTF structure!
  const flowerParts = useMemo(() => [
    { id: 'petals', geometry: nodes['hibiscus_flower-Mesh'].geometry, material: materials.red },
    { id: 'pollen', geometry: nodes['hibiscus_flower-Mesh_1'].geometry, material: materials.hay },
    { id: 'stem',   geometry: nodes['hibiscus_flower-Mesh_2'].geometry, material: materials.tree },
  ], [nodes, materials])

  // 2. Generate Data (Using our shared math file)
  const { particles, randomData } = useMemo(() => generateVineData(FLOWER_COUNT, 0.6), [])

  // 3. Process Geometries (Centering + Attributes)
  const processedParts = useMemo(() => {
    return flowerParts.map((part) => {
      const geom = part.geometry.clone()
      geom.center() // Pivot to center
      
      // CRITICAL: Use InstancedBufferAttribute
      geom.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randomData, 1))
      
      // Fix texture encoding if needed
      if (part.material.map) part.material.map.colorSpace = THREE.SRGBColorSpace
      
      return { ...part, geometry: geom }
    })
  }, [flowerParts, randomData])

  // 4. Update Matrices
  useLayoutEffect(() => {
    const tempObject = new THREE.Object3D()
    
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return
      particles.forEach((data, i) => {
        tempObject.position.copy(data.position)
        tempObject.quaternion.copy(data.rotation)
        tempObject.scale.set(data.scale, data.scale, data.scale)
        tempObject.updateMatrix()
        mesh.setMatrixAt(i, tempObject.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  }, [particles])

  // 5. Animation Loop
  useFrame((state) => {
    materialRefs.current.forEach((mat) => {
      if (mat && mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = state.clock.elapsedTime
      }
    })
  })

  return (
    <group>
      {processedParts.map((part, index) => (
        <instancedMesh
          key={part.id}
          ref={(el) => (meshRefs.current[index] = el!)}
          args={[part.geometry, undefined, FLOWER_COUNT]}
          frustumCulled={false} 
        >
          <CustomShaderMaterial
            ref={(el: any) => (materialRefs.current[index] = el!)}
            baseMaterial={THREE.MeshStandardMaterial}
            vertexShader={vertexShader}
            uniforms={{ uTime: { value: 0 } }}
            
            // Texture & Color Props
            map={part.material.map}
            color={part.material.color}
            
            // Visual Settings
            roughness={1.0} // Matte
            metalness={0.0}
            side={THREE.DoubleSide}
            transparent={true}
            alphaTest={0.5} // Sharp edges for leaves
          />
        </instancedMesh>
      ))}
    </group>
  )
}