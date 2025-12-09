'use client'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Environment } from '@react-three/drei'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'
import { FlowerField } from '@/app/components/FlowerField'
import { CameraRig } from '@/app/components/CameraRig'

export default function Page() {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      background: 'linear-gradient(to bottom, #E6F3FF, #FFE6F0)'
    }}>
      <Canvas camera={{ position: [0, 0, 0], fov: 50 }}>
        {/* 1. Lighting */}
        <ambientLight intensity={0.5} />
        <Environment preset="sunset" /> 

        {/* 2. Controls & Interaction */}
        <ScrollControls pages={5} damping={0.2}>
          <CameraRig />
          
          {/* 3. The Content */}
          <FlowerField />
          
          {/* 4. Post Processing */}
          <EffectComposer>
             <DepthOfField 
               focusDistance={0} // Focus on camera
               focalLength={0.02} // Shallow focus
               bokehScale={2} // Blur intensity
               height={480} 
             />
          </EffectComposer>
        </ScrollControls>
      </Canvas>
    </div>
  )
}