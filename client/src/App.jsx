import { Routes, Route } from 'react-router-dom'
import ChatPage from './ChatPage.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import ThreeDViewerPage from './ThreeDViewerPage.jsx'   // ← naya import

function App() {
  return (
    <Routes>
      <Route
        path="/chat"
        element={
          <ErrorBoundary>
            <ChatPage />
          </ErrorBoundary>
        }
      />
      <Route path="/3d-viewer" element={<ThreeDViewerPage />} />   {/* ← Routes ke ANDAR */}
      <Route path="/" element={<div style={{padding: '2rem'}}>Home page — <a href="/chat">Chat par jaayein</a> | <a href="/3d-viewer">3D Viewer</a></div>} />
    </Routes>
  )
}

export default App