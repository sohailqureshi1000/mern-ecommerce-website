import { lazy, Suspense, useEffect, useState } from 'react'

const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [lowPower, setLowPower] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)
    const handler = (e) => setReducedMotion(e.matches)
    motionQuery.addEventListener('change', handler)

    if ('deviceMemory' in navigator && navigator.deviceMemory <= 2) {
      setLowPower(true)
    }

    return () => motionQuery.removeEventListener('change', handler)
  }, [])

  // Reduced-motion or low-power fallback
  if (reducedMotion || lowPower) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>3D Product Viewer</h1>
        {/* Explicit width/height and aspect-ratio added to fix CLS */}
        <img
          src="/3d-fallback-preview.jpg"
          alt="Static preview of the 3D model with reduced motion mode active"
          width="500"
          height="300"
          loading="lazy"
          style={{ maxWidth: '500px', width: '100%', height: 'auto', aspectRatio: '500 / 300', borderRadius: '8px' }}
        />
        {/* Updated text color to #334155 for contrast compliance */}
        <p style={{ color: '#334155', marginTop: '1rem' }}>
          Motion-reduced mode active — interactive 3D disabled for this device/setting.
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>3D Product Viewer</h1>
      {/* Contrast fixed from #64748B to #334155 */}
      <p style={{ color: '#334155' }}>
        Drag &amp; drop any .glb file onto the scene below, or tweak the default model.
      </p>

      {/* Accessible container section */}
      <section aria-label="Interactive 3D Canvas Scene" style={{ position: 'relative', minHeight: '400px' }}>
        <Suspense fallback={<div style={{ padding: '2rem' }} role="status">Loading 3D scene…</div>}>
          <ThreeDCanvas />
        </Suspense>
      </section>
    </main>
  )
}