import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Clock, CheckSquare, BarChart3, Users, FolderOpen, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  console.log(user)

  const navItems = [
    { path: '/log-work', label: 'My Log Work', icon: FileText },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/', label: 'Dashboard', icon: Clock },
    { path: '/vendors', label: 'Vendors', icon: Users },
    { path: '/projects', label: 'Projects', icon: FolderOpen },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ]

  // Only allow certain nav items for vendor
  const filteredNavItems = user && user.user_metadata && user.user_metadata.role === 'vendor'
    ? navItems.filter(item => ['/log-work', '/tasks'].includes(item.path))
    : navItems

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">TimeTracker</span>
          </div>
          <div className="flex space-x-4 items-center">
            {filteredNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar