import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import PublicBanks from './components/pages/PublicBanks'
import PublicBankDetailPage from './components/pages/PublicBankDetailPage'
import Overview from './components/pages/Overview'
import Companies from './components/pages/Companies'
import Transactions from './components/pages/Transactions'
import Audit from './components/pages/Audit'
import ProtectedRoute from './components/ProtectedRoute'

// Simple Login Component
function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Check if user has admin or superAdmin role
      if (data.user?.role !== 'superAdmin' && data.user?.role !== 'admin') {
        throw new Error('Super Admin access required')
      }

      // Store token and user data
      localStorage.setItem('sa_token', data.token)
      localStorage.setItem('sa_user', JSON.stringify(data.user))

      // Redirect to dashboard
      navigate('/overview')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-600 mt-2">System Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Layout Component with Navigation
function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Get user data (authentication is already checked by ProtectedRoute)
    const userData = localStorage.getItem('sa_user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_user')
    navigate('/')
  }

  const navigation = [
    { name: 'Overview', path: '/overview' },
    { name: 'Companies', path: '/companies' },
    { name: 'Public Banks', path: '/public-banks' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Audit', path: '/audit' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name || 'Admin'}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-16">
        {/* Fixed Sidebar */}
        <nav className="fixed left-0 top-16 w-64 bg-white shadow-sm h-[calc(100vh-4rem)] overflow-y-auto z-40">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content with left margin for sidebar */}
        <main className="ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  // Get the base URL for router - in production it will be '/super-admin'
  const basename = process.env.NODE_ENV === 'production' ? '/super-admin' : ''

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/overview" element={
          <ProtectedRoute>
            <Layout><Overview /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/companies" element={
          <ProtectedRoute>
            <Layout><Companies /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/companies/:companyId" element={
          <ProtectedRoute>
            <Layout><Companies /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/public-banks" element={
          <ProtectedRoute>
            <Layout><PublicBanks /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/public-banks/:id" element={
          <ProtectedRoute>
            <Layout><PublicBankDetailPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout><Transactions /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute>
            <Layout><Audit /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
