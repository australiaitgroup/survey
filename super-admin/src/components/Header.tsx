import React from 'react'

interface HeaderProps {
  currentTabName: string
  loading: boolean
  onToggleSidebar: () => void
  onRefresh: () => void
}

const Header: React.FC<HeaderProps> = ({
  currentTabName,
  loading,
  onToggleSidebar,
  onRefresh
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 ml-4 lg:ml-0">
            {currentTabName}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            className={`p-2 text-gray-400 hover:text-gray-500 ${loading ? 'animate-spin' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header