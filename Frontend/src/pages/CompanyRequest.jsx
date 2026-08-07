import { useEffect, useState } from 'react'
import { Building2, Send, RefreshCw } from 'lucide-react'
import { createStudentCompanyRequest, getStudentCompanyRequests } from '../api'

const statusBadgeClass = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
}

export default function CompanyRequest() {
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ name: '', location: '', note: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStudentCompanyRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load company requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const onChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setError('Company name is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await createStudentCompanyRequest({
        name,
        location: form.location.trim(),
        note: form.note.trim(),
      })
      setForm({ name: '', location: '', note: '' })
      setSuccess('Request submitted successfully. Admin will review it shortly.')
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Unable to send request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Request New Company</h1>
          <p className="text-gray-500 mt-1">Submit a company that is missing from the internship list. Your request goes directly to admin.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={loadRequests} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">Company Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="e.g. Nova Industries"
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input
                className="form-input"
                value={form.location}
                onChange={(event) => onChange('location', event.target.value)}
                placeholder="e.g. Kumasi"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Additional Note</label>
            <textarea
              className="form-input min-h-[90px] resize-none"
              value={form.note}
              onChange={(event) => onChange('note', event.target.value)}
              placeholder="Any details that can help admin validate this company..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            <Send size={14} /> {saving ? 'Submitting...' : 'Send Request'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-primary-600" />
          <h2 className="font-heading text-lg font-semibold text-gray-800">Request History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header text-left">Company</th>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Admin Note</th>
                <th className="table-header text-left">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell font-medium text-gray-800">{item.name}</td>
                  <td className="table-cell text-gray-600">{item.location || '-'}</td>
                  <td className="table-cell">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass[item.status] || 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">{item.admin_note || '-'}</td>
                  <td className="table-cell text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                    No requests yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                    Loading requests...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
