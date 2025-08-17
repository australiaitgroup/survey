import React, { useState, useEffect } from 'react'
import PublicBankDetailView from '../publicBanks/PublicBankDetailView'
import PublicBankModal from '../publicBanks/PublicBankModal'
import { PublicBank, PublicBankFormData } from '../../types/publicBanks'
import { PublicBanksAPI } from '../../api/publicBanks'
import { mockPublicBanks } from '../../data/mockPublicBanks'

const PublicBanks: React.FC = () => {
  const api = new PublicBanksAPI()
  const [banks, setBanks] = useState<PublicBank[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<PublicBank | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBank, setEditingBank] = useState<PublicBank | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    loadBanks()
  }, [])

  const loadBanks = async () => {
    setLoading(true)
    try {
      const response = await api.getPublicBanks({ page: 1, limit: 100 })
      if (response.success && response.data) {
        setBanks(response.data.banks || [])
      }
    } catch (error) {
      console.log('Error loading banks:', error)
      // Fallback to direct API call if needed
      try {
        const response = await fetch('/api/sa/public-banks')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setBanks(data.data)
          }
        } else {
          // Use mock data for demo
          setBanks(mockPublicBanks)
        }
      } catch (fallbackError) {
        console.log('API not available, using mock data')
        setBanks(mockPublicBanks)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredBanks = banks.filter(bank =>
    bank.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewBank = (bank: PublicBank) => {
    setSelectedBank(bank)
  }

  const handleBackToList = () => {
    setSelectedBank(null)
    loadBanks() // Refresh the list when coming back
  }

  const handleCreateBank = () => {
    setEditingBank(null)
    setShowModal(true)
  }

  const handleEditBank = (bank: PublicBank) => {
    setEditingBank(bank)
    setShowModal(true)
  }

  const handleDeleteBank = async (bank: PublicBank) => {
    if (!confirm(`Are you sure you want to delete "${bank.title}"?`)) {
      return
    }

    try {
      const response = await api.deletePublicBank(bank._id)
      if (response.success) {
        await loadBanks()
      } else {
        alert('Failed to delete bank')
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
      alert('Failed to delete bank')
    }
  }

  const handleSaveBank = async (data: PublicBankFormData) => {
    setModalLoading(true)
    try {
      let response
      if (editingBank) {
        response = await api.updatePublicBank(editingBank._id, data)
      } else {
        response = await api.createPublicBank(data)
      }

      if (response.success) {
        await loadBanks()
        setShowModal(false)
        setEditingBank(null)
      } else {
        alert(response.error || 'Failed to save bank')
      }
    } catch (error) {
      console.error('Error saving bank:', error)
      alert('Failed to save bank')
    } finally {
      setModalLoading(false)
    }
  }

  // If a bank is selected, show the detail view
  if (selectedBank) {
    return (
      <PublicBankDetailView 
        bank={selectedBank} 
        onBack={handleBackToList}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading banks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Public Question Banks</h2>
            <p className="text-sm text-gray-600 mt-1">Manage public question banks</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search banks..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            <button 
              onClick={handleCreateBank}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Bank
            </button>
            
            <button
              onClick={loadBanks}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Banks</p>
              <p className="text-2xl font-semibold text-gray-900">{banks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Banks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banks.filter(b => b.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banks.reduce((sum, b) => sum + (b.questionCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usage Count</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Banks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Question Banks</h3>
        </div>

        {filteredBanks.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No question banks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No banks match your search.' : 'Create your first public question bank to get started.'}
            </p>
            {!searchTerm && (
              <button 
                onClick={handleCreateBank}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Question Bank
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanks.map((bank) => (
                  <tr key={bank._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bank.title}</div>
                        <div className="text-sm text-gray-500">{bank.description || 'No description'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bank.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bank.type || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bank.questionCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bank.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bank.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bank.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewBank(bank)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditBank(bank)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBank(bank)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <PublicBankModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingBank(null)
        }}
        onSubmit={handleSaveBank}
        editingBank={editingBank}
        loading={modalLoading}
      />
    </div>
  )
}

export default PublicBanks