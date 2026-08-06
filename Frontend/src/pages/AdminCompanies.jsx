import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Plus, Search, Trash2, RefreshCw } from 'lucide-react'
import { createAdminCompany, deleteAdminCompany, getAdminCompanies, updateAdminCompany } from '../api'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyActive, setNewCompanyActive] = useState(true)
  const [loading, setLoading] = useState(false)
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
  }, [])

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return companies
    return companies.filter((company) => company.name.toLowerCase().includes(term))
  }, [companies, search])

  const handleCreate = async (event) => {
    event.preventDefault()
    const name = newCompanyName.trim()
    if (!name) {
      setError('Company name is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createAdminCompany({ name, is_active: newCompanyActive })
      setNewCompanyName('')
      setNewCompanyActive(true)
      await loadCompanies(search)
    } catch (err) {
      setError(err.message || 'Unable to create company.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (company) => {
    setError('')
    try {
      await updateAdminCompany(company.id, { is_active: !company.is_active })
      await loadCompanies(search)
    } catch (err) {
      setError(err.message || 'Unable to update company.')
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Companies</h1>
          <p className="text-gray-500 mt-1">Manage the official internship company directory used in student registration.</p>
        </div>
        <button
          type="button"
          onClick={() => loadCompanies(search)}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card p-5">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="form-label">Company Name</label>
            <input
              className="form-input"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g. Tech Innovation Ltd"
            />
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white">
            <input
              type="checkbox"
              checked={newCompanyActive}
              onChange={(e) => setNewCompanyActive(e.target.checked)}
              className="h-4 w-4 rounded accent-primary-600"
            />
            Active
          </label>
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
                <th className="table-header text-left">Status</th>
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
                  <td className="table-cell">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(company)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {company.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
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
