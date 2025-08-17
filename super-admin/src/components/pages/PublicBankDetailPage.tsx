import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PublicBankDetailView from '../publicBanks/PublicBankDetailView'
import type { PublicBank } from '../../types/publicBanks'

const PublicBankDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bank, setBank] = React.useState<PublicBank | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('sa_token')
        const res = await fetch(`/api/sa/public-banks/${encodeURIComponent(id)}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
          signal: controller.signal
        })
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          // Fallback: try list endpoint then find by id
          const listRes = await fetch('/api/sa/public-banks?page=1&limit=1000', {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            signal: controller.signal
          })
          const listJson = await listRes.json()
          const list = listJson?.data || listJson || []
          const found = Array.isArray(list) ? list.find((b: any) => b._id === id) : null
          if (found) {
            setBank(found)
            return
          } else {
            const text = await res.text()
            throw new Error(`Unexpected response: ${text.slice(0, 120)}`)
          }
        }
        const data = await res.json()
        if (!res.ok || data?.success === false) {
          throw new Error(data?.error || 'Failed to load bank')
        }
        setBank(data.data || data)
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message || 'Failed to load bank')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error || !bank) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <div className="text-red-600 mb-4">{error || 'Bank not found'}</div>
        <button onClick={() => navigate('/public-banks')} className="px-4 py-2 bg-gray-600 text-white rounded">
          Back to list
        </button>
      </div>
    )
  }

  return (
    <PublicBankDetailView
      bank={bank}
      onBack={() => navigate('/public-banks')}
    />
  )
}

export default PublicBankDetailPage
