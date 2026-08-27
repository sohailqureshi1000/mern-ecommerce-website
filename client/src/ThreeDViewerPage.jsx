import { lazy, Suspense } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  return (
    <main style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>
        3D Product Viewer
      </h1>
      <p style={{ color: '#334155', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Drag &amp; drop any .glb file onto the scene below, or view the default model.
      </p>

      {/* Fixed aspect container prevents CLS/Layout Shift */}
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
          backgroundColor: '#f8fafc' 
        }}
      >
        <Suspense fallback={
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }} role="status">
            <p style={{ color: '#334155' }}>Loading 3D Engine...</p>
          </div>
        }>
          <ThreeDCanvas />
        </Suspense>
      </section>
    </main>
  )
}