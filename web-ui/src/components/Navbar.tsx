import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Clock, CheckSquare, BarChart3, Users, FolderOpen, FileText, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [vendorName, setVendorName] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendorName = async () => {
      if (user && user.user_metadata?.role === 'vendor') {
        const { data: vendorData, error } = await supabase
          .from('vendors')
          .select('name')
          .eq('email', user.email)
          .single()
        if (!error && vendorData?.name) {
          setVendorName(vendorData.name)
        } else {
          setVendorName(null)
        }
      } else {
        setVendorName(null)
      }
    }
    fetchVendorName()
  }, [user])

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Clock },
    { path: '/log-work', label: 'My Log Work', icon: FileText },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
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
            {user && user.user_metadata?.role === 'vendor' && vendorName && (
              <span className="text-sm text-gray-700 font-bold mr-1">Hello, {vendorName}</span>
            )}
            {user && user.user_metadata?.role === 'admin' && (
              <span className="text-sm text-gray-700 font-bold mr-1">Hello, Admin</span>
            )}
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
            {user && user.user_metadata?.role === 'admin' && (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none">
                  <SettingsIcon className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20">
                  <Link
                    to="/vendors"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  >
                    <Users className="inline-block h-4 w-4 mr-2" />Vendors
                  </Link>
                  <Link
                    to="/projects"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  >
                    <FolderOpen className="inline-block h-4 w-4 mr-2" />Projects
                  </Link>
                </div>
              </div>
            )}
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