import React from 'react'

interface SidebarProps {
  navigation: Array<{
    id: string
    name: string
    path: string
    icon: React.ReactNode
  }>
  currentPath: string
  user: {
    name: string
    email: string
  }
  sidebarOpen: boolean
  onNavigate: (path: string) => void
  onLogout: () => void
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  currentPath,
  user,
  sidebarOpen,
  onNavigate,
  onLogout
}) => {
  return (
    <div className={`bg-gray-900 text-white w-64 min-h-screen transition-transform duration-300 fixed lg:relative lg:translate-x-0 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Super Admin</h1>
        <p className="text-gray-400 text-sm mt-1">System Management</p>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
              currentPath === item.path ? 'bg-gray-800 text-white border-r-2 border-blue-500' : ''
            }`}
          >
            <span className="w-5 h-5 mr-3">
              {item.icon}
            </span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {/* User Info */}
      <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-gray-400 text-xs">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar