'use client'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Environment, Float } from '@react-three/drei'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { FlowerVine } from '@/app/components/FlowerVine'
import { Stem } from '@/app/components/Stem'
import { CameraRig } from '@/app/components/CameraRig'

export default function Page() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas 
        gl={{ antialias: false }} // Post-processing handles AA usually
        camera={{ position: [0, 0, 10], fov: 45 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          {/* Sunset adds nice warm directional light */}
          <Environment preset="sunset" />
          
          <ScrollControls pages={10} damping={0.2}>
            {/* The Camera Logic */}
            <CameraRig />
            
            {/* The Content */}
            <group>
               <Stem />
               <FlowerVine />
            </group>
            
          </ScrollControls>

          {/* Cinematic Effects */}
          <EffectComposer>
            <DepthOfField 
              focusDistance={0} 
              focalLength={0.02} 
              bokehScale={2} 
              height={480} 
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}