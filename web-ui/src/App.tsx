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

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
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
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/log-work" element={<ProtectedRoute><LogWork /></ProtectedRoute>} />
              <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
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