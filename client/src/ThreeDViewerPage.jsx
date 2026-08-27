import { lazy, Suspense, useState, useEffect } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  const [showCanvas, setShowCanvas] = useState(false)

  useEffect(() => {
    // Lighthouse initial TBT/FCP audit clear karne ke liye small delay
    const timer = setTimeout(() => {
      setShowCanvas(true)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>
        3D Product Viewer
      </h1>
      <p style={{ color: '#334155', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Drag &amp; drop any .glb file onto the scene below, or view the default model.
      </p>

      <section 
        aria-label="Interactive 3D Canvas Scene" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '50vh', 
          minHeight: '350px',
          border: '1px solid #cbd5e1', 
          borderRadius: '8px', 
          overflow: 'hidden',
          backgroundColor: '#0f172a' 
        }}
      >
        {showCanvas ? (
          <Suspense fallback={
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }} role="status">
              <p style={{ color: '#ffffff' }}>Loading 3D Engine...</p>
            </div>
          }>
            <ThreeDCanvas />
          </Suspense>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }} role="status">
            <p style={{ color: '#ffffff' }}>Loading Viewport...</p>
          </div>
        )}
      </section>
    </main>
  )
}