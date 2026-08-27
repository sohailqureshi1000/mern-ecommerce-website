import { lazy, Suspense, useEffect, useState } from 'react'

// Heavy 3D bundle (three, @react-three/fiber, drei) sirf tab load hoga
// jab is component ko render karna ho — yehi "lazy-loaded canvas" requirement hai
const ThreeDCanvas = lazy(() => import('./ThreeDCanvas.jsx'))

export default function ThreeDViewerPage() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [lowPower, setLowPower] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)
    const handler = (e) => setReducedMotion(e.matches)
    motionQuery.addEventListener('change', handler)

    // Rough low-power / low-memory device check (best-effort, not perfect)
    if ('deviceMemory' in navigator && navigator.deviceMemory <= 2) {
      setLowPower(true)
    }

    return () => motionQuery.removeEventListener('change', handler)
  }, [])

  // Reduced-motion or low-power fallback: static image, no WebGL, no JS 3D cost
  if (reducedMotion || lowPower) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>3D Product Viewer</h1>
        <img
          src="/3d-fallback-preview.jpg"
          alt="Static preview of the 3D model — reduced motion mode is on"
          style={{ maxWidth: '500px', width: '100%', borderRadius: '8px' }}
        />
        <p style={{ color: '#64748B', marginTop: '1rem' }}>
          Motion-reduced mode active — interactive 3D disabled for this device/setting.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>3D Product Viewer</h1>
      <p style={{ color: '#64748B' }}>
        Drag &amp; drop any .glb file onto the scene below, or tweak the default model.
      </p>
      <Suspense fallback={<div style={{ padding: '2rem' }}>Loading 3D scene…</div>}>
        <ThreeDCanvas />
      </Suspense>
    </div>
  )
}