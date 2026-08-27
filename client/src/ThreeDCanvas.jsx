import { lazy, Suspense, useEffect, useState } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  const [shouldLoadCanvas, setShouldLoadCanvas] = useState(false)

  useEffect(() => {
    // Initial page paint (FCP/LCP) ko complete hone dene ke liye 300ms delay
    const timer = setTimeout(() => {
      setShouldLoadCanvas(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main style={{ padding: '2rem' }}>
      <h1>3D Product Viewer</h1>
      <p style={{ color: '#334155' }}>
        Drag &amp; drop any .glb file onto the scene below, or tweak the default model.
      </p>

      <section aria-label="Interactive 3D Canvas Scene" style={{ position: 'relative', minHeight: '400px' }}>
        {shouldLoadCanvas ? (
          <Suspense fallback={<div style={{ padding: '2rem' }} role="status">Loading 3D scene…</div>}>
            <ThreeDCanvas />
          </Suspense>
        ) : (
          <div 
            style={{ 
              height: '60vh', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#F8FAFC'
            }}
          >
            <p role="status" style={{ color: '#334155' }}>Initializing 3D Viewport...</p>
          </div>
        )}
      </section>
    </main>
  )
}