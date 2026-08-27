import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Bounds, Html } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

const DEFAULT_MODEL_URL = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'

function Model({ url, color, metalness, roughness, wireframe }) {
  const { scene } = useGLTF(url)

  // useEffect inside traverse prevents main-thread JS blocking on every frame
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color = new THREE.Color(color)
        child.material.metalness = metalness
        child.material.roughness = roughness
        child.material.wireframe = wireframe
      }
    })
  }, [scene, color, metalness, roughness, wireframe])

  return <primitive object={scene} />
}

export default function ThreeDCanvas() {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL)

  const { color, metalness, roughness, wireframe, envPreset, autoRotateSpeed } = useControls({
    color: '#2563EB',
    metalness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    wireframe: false,
    envPreset: { value: 'city', options: ['city', 'sunset', 'dawn', 'warehouse', 'studio'] },
    autoRotateSpeed: { value: 1, min: 0, max: 5, step: 0.5 },
  })

  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.glb')) {
      setModelUrl(URL.createObjectURL(file))
    }
  }

  return (
    <div
      role="region"
      aria-label="Interactive 3D Product Canvas"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ 
        width: '100%', 
        height: '70vh', 
        touchAction: 'none', 
        border: '1px solid #E2E8F0', 
        borderRadius: '8px', 
        position: 'relative' 
      }}
    >
      {/* Screen Reader Description */}
      <span className="sr-only">
        Interactive 3D Model Viewport. Use mouse or touch to rotate. Drop a .glb file to replace model.
      </span>

      <Canvas
        shadows={false}
        dpr={[1, 1.2]} 
        camera={{ fov: 45, position: [3, 2, 5] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={<Html center><p role="status" style={{ color: '#000' }}>Loading 3D Model...</p></Html>}>
          <Bounds fit clip observe margin={1.2}>
            <Model
              url={modelUrl}
              color={color}
              metalness={metalness}
              roughness={roughness}
              wireframe={wireframe}
            />
          </Bounds>
          <Environment preset={envPreset} />
          <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={8} blur={2} />
        </Suspense>

        <OrbitControls
          autoRotate={autoRotateSpeed > 0}
          autoRotateSpeed={autoRotateSpeed}
          enableDamping
          makeDefault
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(DEFAULT_MODEL_URL)