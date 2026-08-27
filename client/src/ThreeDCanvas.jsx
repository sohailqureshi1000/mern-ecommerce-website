import { useState, useRef, useCallback, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Bounds } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

// Small, well-known public sample model as the default preload
const DEFAULT_MODEL_URL = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
function Model({ url, color, metalness, roughness, wireframe }) {
  const { scene } = useGLTF(url)

  // Apply configurator overrides to every mesh material in the loaded model
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.color = new THREE.Color(color)
      child.material.metalness = metalness
      child.material.roughness = roughness
      child.material.wireframe = wireframe
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return <primitive object={scene} />
}

function DropZone({ onDrop }) {
  const { gl } = useThree()

  useCallback(() => {}, []) // placeholder to keep hooks order stable

  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.glb')) {
      const blobUrl = URL.createObjectURL(file)
      onDrop(blobUrl)
    }
  }

  // Attach listeners to the actual canvas DOM element
  gl.domElement.ondragover = handleDragOver
  gl.domElement.ondrop = handleDrop

  return null
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

  return (
    <div
      style={{ width: '100%', height: '70vh', touchAction: 'none', border: '1px solid #E2E8F0', borderRadius: '8px' }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]} // caps device pixel ratio — perf budget for mobile
        camera={{ fov: 45, position: [3, 2, 5] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

        <Suspense fallback={null}>
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
          <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2} />
        </Suspense>

        <DropZone onDrop={setModelUrl} />

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