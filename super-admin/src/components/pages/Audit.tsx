import React from 'react'

const Audit: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Audit Logs</h2>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          Refresh
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-gray-500 text-center">
          No audit logs yet.
        </div>
      </div>
    </div>
  )
}

export default Audit