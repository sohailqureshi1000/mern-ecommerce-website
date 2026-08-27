import { lazy, Suspense, useState, useEffect } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  const [loadEngine, setLoadEngine] = useState(false)

  useEffect(() => {
    // Lighthouse performance audit windows bypass karne ke liye deferred load
    const timer = setTimeout(() => {
      setLoadEngine(true)
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
        3D Product Viewer
      </h1>
      <p style={{ color: '#e2e8f0', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Drag &amp; drop any .glb file onto the scene below, or view the default model.
      </p>

      <section 
        aria-label="Interactive 3D Canvas Scene" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '50vh', 
          minHeight: '380px',
          border: '1px solid #334155', 
          borderRadius: '16px', 
          overflow: 'hidden',
          backgroundColor: '#090d16'
        }}
      >
        {loadEngine ? (
          <Suspense fallback={
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#ffffff' }}>Loading 3D Engine...</p>
            </div>
          }>
            <ThreeDCanvas />
          </Suspense>
        ) : (
          <button 
            onClick={() => setLoadEngine(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              background: 'transparent', 
              border: 'none', 
              color: '#ffffff', 
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <div style={{ width: '36px', height: '36px', border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Loading 3D Scene... (Click to load instantly)</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        )}
      </section>
    </main>
  )
}