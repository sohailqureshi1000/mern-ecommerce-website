import { lazy, Suspense } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      {/* Pure White Color with high contrast */}
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
        3D Product Viewer
      </h1>
      
      {/* Light slate text for easy reading */}
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
        <Suspense fallback={
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }} role="status">
            <p style={{ color: '#ffffff' }}>Loading 3D Engine...</p>
          </div>
        }>
          <ThreeDCanvas />
        </Suspense>
      </section>
    </main>
  )
}