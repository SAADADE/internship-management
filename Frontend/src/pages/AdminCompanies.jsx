import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Plus, Search, Trash2, RefreshCw } from 'lucide-react'
import {
  createAdminCompany,
  deleteAdminCompany,
  getAdminCompanies,
  getAdminCompanyRequests,
  reviewAdminCompanyRequest,
} from '../api'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyLocation, setNewCompanyLocation] = useState('')
  const [companyRequests, setCompanyRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCompanies = async (query = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminCompanies(query)
      setCompanies(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load companies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies('')
    loadCompanyRequests()
  }, [])

  const loadCompanyRequests = async () => {
    setRequestsLoading(true)
    setError('')
    try {
      const data = await getAdminCompanyRequests('pending')
      setCompanyRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load company requests.')
    } finally {
      setRequestsLoading(false)
    }
  }

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return companies
    return companies.filter((company) => {
      const name = (company.name || '').toLowerCase()
      const location = (company.location || '').toLowerCase()
      return name.includes(term) || location.includes(term)
    })
  }, [companies, search])

  const handleCreate = async (event) => {
    event.preventDefault()
    const name = newCompanyName.trim()
    const location = newCompanyLocation.trim()
    if (!name) {
      setError('Company name is required.')
      return
    }
    if (!location) {
      setError('Company location is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createAdminCompany({ name, location })
      setNewCompanyName('')
      setNewCompanyLocation('')
      await loadCompanies(search)
    } catch (err) {
      setError(err.message || 'Unable to create company.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (company) => {
    const confirmed = window.confirm(`Delete ${company.name}?`)
    if (!confirmed) return

    setError('')
    try {
      await deleteAdminCompany(company.id)
      await loadCompanies(search)
    } catch (err) {
      setError(err.message || 'Unable to delete company.')
    }
  }

  const handleRequestReview = async (requestItem, status) => {
    const promptText = status === 'approved'
      ? 'Optional approval note for student (leave blank to skip):'
      : 'Optional rejection reason for student (leave blank to skip):'
    const adminNote = window.prompt(promptText, '')
    if (adminNote === null) return

    setError('')
    try {
      await reviewAdminCompanyRequest(requestItem.id, {
        status,
        admin_note: adminNote,
      })
      await Promise.all([loadCompanyRequests(), loadCompanies(search)])
    } catch (err) {
      setError(err.message || 'Unable to review request.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Companies</h1>
          <p className="text-gray-500 mt-1">Manage the official internship company directory used in student registration.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadCompanies(search)
            loadCompanyRequests()
          }}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-gray-900">Pending Company Requests</h2>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {companyRequests.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header text-left">Company</th>
                <th className="table-header text-left">Requested By</th>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-left">Note</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companyRequests.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell font-medium text-gray-800">{item.name}</td>
                  <td className="table-cell text-sm text-gray-600">
                    <p className="font-medium text-gray-700">{item.requestedBy?.name || '-'}</p>
                    <p>{item.requestedBy?.index_number || '-'}</p>
                  </td>
                  <td className="table-cell text-gray-600">{item.location || '-'}</td>
                  <td className="table-cell text-gray-600">{item.note || '-'}</td>
                  <td className="table-cell text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRequestReview(item, 'approved')}
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestReview(item, 'rejected')}
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!requestsLoading && companyRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                    No pending requests.
                  </td>
                </tr>
              )}
              {requestsLoading && (
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

      <div className="card p-5">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="form-label">Company Name</label>
            <input
              className="form-input"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g. Tech Innovation Ltd"
            />
          </div>
          <div>
            <label className="form-label">Location</label>
            <input
              className="form-input"
              value={newCompanyLocation}
              onChange={(e) => setNewCompanyLocation(e.target.value)}
              placeholder="e.g. Kumasi"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Plus size={14} /> {saving ? 'Saving...' : 'Add Company'}
          </button>
        </form>
      </div>

      <div className="card p-5 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="form-input pl-10"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header text-left">Company</th>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-left">Added By</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="table-cell text-gray-800 font-medium">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-primary-600" /> {company.name}
                    </div>
                  </td>
                  <td className="table-cell text-gray-600">{company.location || '-'}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {company.createdBy?.username || 'System'}
                  </td>
                  <td className="table-cell text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(company)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-gray-500 py-8">
                    No companies found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-gray-500 py-8">
                    Loading companies...
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
