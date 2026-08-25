import { Routes, Route } from 'react-router-dom'
import ChatPage from './ChatPage.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

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
      <Route path="/" element={<div style={{padding: '2rem'}}>Home page — <a href="/chat">Chat par jaayein</a></div>} />
    </Routes>
  )
}

export default App