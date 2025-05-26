import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import LogWork from './pages/LogWork'
import Vendors from './pages/Vendors'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './hooks/useAuth'

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.user_metadata.role)) {
    // If user is vendor and not allowed, redirect to /log-work
    if (user.user_metadata.role === 'vendor') {
      return <Navigate to="/log-work" replace />
    }
    // Otherwise, redirect to dashboard
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <AuthWrapper>
            <Navbar />
          </AuthWrapper>
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'manager']} children={<Dashboard />} />} />
              <Route path="/tasks" element={<ProtectedRoute children={<Tasks />} />} />
              <Route path="/log-work" element={<ProtectedRoute children={<LogWork />} />} />
              <Route path="/vendors" element={<ProtectedRoute allowedRoles={['admin', 'manager']} children={<Vendors />} />} />
              <Route path="/projects" element={<ProtectedRoute allowedRoles={['admin', 'manager']} children={<Projects />} />} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']} children={<Reports />} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

function AuthWrapper({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return null
  return children
}

export default App