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
      aria-label="Interactive 3D Model Viewport"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ width: '100%', height: '100%', touchAction: 'none', outline: 'none' }}
    >
      <Canvas
        frameloop="demand"
        shadows={false}
        dpr={1}
        camera={{ fov: 45, position: [0, 1, 5] }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        {/* High-intensity lights so model is bright */}
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 8, 5]} intensity={2.2} />
        <directionalLight position={[-5, -2, -5]} intensity={1.0} />

        <Suspense fallback={<Html center><p role="status" style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>Loading Model...</p></Html>}>
          <Bounds fit clip observe margin={1.2}>
            <Model url={modelUrl} />
          </Bounds>
          <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={8} blur={2} />
        </Suspense>

        <OrbitControls enableDamping={false} makeDefault />
      </Canvas>
    </div>
  )
}