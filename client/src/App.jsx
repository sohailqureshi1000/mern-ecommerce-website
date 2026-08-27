import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary.jsx'

// Heavy pages ko Lazy Load karein taake initial JS bundle fast load ho
const ChatPage = lazy(() => import('./ChatPage.jsx'))
const ThreeDViewerPage = lazy(() => import('./ThreeDViewerPage.jsx'))

function App() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <Routes>
        <Route
          path="/chat"
          element={
            <ErrorBoundary>
              <ChatPage />
            </ErrorBoundary>
          }
        />
        <Route path="/3d-viewer" element={<ThreeDViewerPage />} />
        <Route 
          path="/" 
          element={
            <main style={{ padding: '2rem' }}>
              <h1>Home Page</h1>
              <nav aria-label="Main Navigation">
                <Link to="/chat">Chat par jaayein</Link> | <Link to="/3d-viewer">3D Viewer</Link>
              </nav>
            </main>
          } 
        />
      </Routes>
    </Suspense>
  )
}

export default App