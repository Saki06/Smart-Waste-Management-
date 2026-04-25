import { Routes, Route } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import Home from './pages/Home'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CampusBin from './pages/CampusBin'
import RiskMap from './pages/RiskMap'
import MosquitoPanel from './pages/MosquitoPanel'
import SuspiciousActivity from './pages/SuspiciousActivity'
import StudentPortal from './pages/StudentPortal'
import Analytics from './pages/Analytics'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fee',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>⚠️ Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-portal" element={<StudentPortal />} />
        
        {/* Main dashboard routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Bin Management */}
          <Route path="/campus-bin" element={<CampusBin />} />
          <Route path="/bins" element={<CampusBin />} />
          
          {/* Mapping & Location */}
          <Route path="/risk-map" element={<RiskMap />} />
          <Route path="/map" element={<RiskMap />} />
          
          {/* Monitoring & Alerts */}
          <Route path="/suspicious-activity" element={<SuspiciousActivity />} />
          <Route path="/alerts" element={<SuspiciousActivity />} />
          
          {/* Disease/Pest Detection */}
          <Route path="/mosquito-panel" element={<MosquitoPanel />} />
          
          {/* Data Analysis & Insights */}
          <Route path="/analytics" element={<Analytics />} />
          
          {/* Placeholder routes - consider implementing or removing */}
          <Route path="/predictions" element={<Dashboard />} />
          <Route path="/assignments" element={<Dashboard />} />
          <Route path="/reports" element={<Dashboard />} />
          <Route path="/devices" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
        </Route>

        {/* Catch-all 404 route */}
        <Route path="*" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <a href="/">Go Home</a>
          </div>
        } />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
