import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, Bounds, Html } from '@react-three/drei'

const DEFAULT_MODEL_URL = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'

function Model({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export default function ThreeDCanvas() {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL)

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
        height: '60vh', 
        touchAction: 'none', 
        border: '1px solid #E2E8F0', 
        borderRadius: '8px', 
        position: 'relative' 
      }}
    >
      <span className="sr-only">
        Interactive 3D Model Viewport. Use mouse or touch to rotate. Drop a .glb file to replace model.
      </span>

      <Canvas
        frameloop="demand"
        shadows={false}
        dpr={1}
        camera={{ fov: 45, position: [3, 2, 5] }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />

        <Suspense fallback={<Html center><p role="status" style={{ color: '#000' }}>Loading 3D Model...</p></Html>}>
          <Bounds fit clip observe margin={1.2}>
            <Model url={modelUrl} />
          </Bounds>
          <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={8} blur={2} />
        </Suspense>

        <OrbitControls enableDamping={false} makeDefault />
      </Canvas>
    </div>
  )
}

useGLTF.preload(DEFAULT_MODEL_URL)