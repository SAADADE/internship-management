import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2, X, Save, RefreshCw, Briefcase } from 'lucide-react'
import {
  deleteStudentInternship,
  getStudentInternships,
  updateStudentInternship,
} from '../api'

const EMPTY_FORM = {
  company_name: '',
  company_address: '',
  internship_position: '',
  internship_supervisor: '',
  internship_supervisor_email: '',
  department: '',
  description: '',
  start_date: '',
  end_date: '',
}

function toInputDate(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  return ''
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function statusStyles(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'active') return 'bg-emerald-100 text-emerald-700'
  if (normalized === 'completed') return 'bg-sky-100 text-sky-700'
  if (normalized === 'rejected') return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function validateForm(form) {
  const errors = {}
  if (!form.company_name?.trim()) errors.company_name = 'Company name is required.'
  if (!form.internship_position?.trim()) errors.internship_position = 'Internship position is required.'
  if (!form.internship_supervisor?.trim()) errors.internship_supervisor = 'Supervisor name is required.'

  if (form.internship_supervisor_email?.trim()) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.internship_supervisor_email.trim())
    if (!emailOk) errors.internship_supervisor_email = 'Enter a valid supervisor email address.'
  }

  if (!form.start_date) errors.start_date = 'Start date is required.'
  if (!form.end_date) errors.end_date = 'End date is required.'
  if (form.start_date && form.end_date && form.start_date >= form.end_date) {
    errors.end_date = 'End date must be after start date.'
  }

  return errors
}

export default function StudentInternships() {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const hasInternships = useMemo(() => internships.length > 0, [internships])

  const loadInternships = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStudentInternships()
      setInternships(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load internships.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInternships()
  }, [])

  const startEdit = (internship) => {
    setEditingId(internship.internship_id)
    setEditErrors({})
    setEditForm({
      company_name: internship.company_name || '',
      company_address: internship.company_address || '',
      internship_position: internship.internship_position || '',
      internship_supervisor: internship.internship_supervisor || '',
      internship_supervisor_email: internship.internship_supervisor_email || '',
      department: internship.department || '',
      description: internship.description || '',
      start_date: toInputDate(internship.start_date),
      end_date: toInputDate(internship.end_date),
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditForm(EMPTY_FORM)
    setEditErrors({})
  }

  const saveEdit = async () => {
    const errors = validateForm(editForm)
    if (Object.keys(errors).length) {
      setEditErrors(errors)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...editForm,
        internship_duration: `${editForm.start_date} to ${editForm.end_date}`,
      }
      const updated = await updateStudentInternship(editingId, payload)

      setInternships((current) =>
        current.map((item) => (item.internship_id === editingId ? updated : item))
      )
      cancelEdit()
    } catch (err) {
      setError(err.message || 'Unable to save internship changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (internship) => {
    const confirmed = window.confirm(`Delete internship at ${internship.company_name}?`)
    if (!confirmed) return

    setDeletingId(internship.internship_id)
    setError('')
    try {
      await deleteStudentInternship(internship.internship_id)
      setInternships((current) => current.filter((item) => item.internship_id !== internship.internship_id))
      if (editingId === internship.internship_id) {
        cancelEdit()
      }
    } catch (err) {
      setError(err.message || 'Unable to delete internship.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">My Internships</h1>
          <p className="text-gray-500 mt-1">
            View all your internship registrations and update or remove entries when details change.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInternships}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !hasInternships && (
        <div className="card p-10 text-center text-gray-500">Loading internships...</div>
      )}

      {!loading && !hasInternships && (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Briefcase size={20} className="text-primary-700" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-gray-900">No internship registrations yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Register your first internship from the Internship Registration page.
          </p>
        </div>
      )}

      {hasInternships && (
        <div className="space-y-4">
          {internships.map((internship) => {
            const isEditing = internship.internship_id === editingId
            const isDeleting = internship.internship_id === deletingId

            return (
              <article key={internship.internship_id} className="card p-5 border border-gray-100">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-gray-900">{internship.company_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{internship.internship_position || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles(internship.status)}`}>
                          {(internship.status || 'pending').toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(internship)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(internship)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Supervisor:</span> {internship.internship_supervisor || '-'}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Supervisor Email:</span> {internship.internship_supervisor_email || '-'}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Department:</span> {internship.department || '-'}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Address:</span> {internship.company_address || '-'}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Start Date:</span> {formatDate(internship.start_date)}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">End Date:</span> {formatDate(internship.end_date)}</p>
                    </div>

                    {internship.description && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">Description:</span> {internship.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading text-lg font-semibold text-gray-900">Edit Internship</h3>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          <X size={14} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
                        >
                          <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Company Name *</label>
                        <input
                          className="form-input"
                          value={editForm.company_name}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, company_name: value }))
                            setEditErrors((current) => ({ ...current, company_name: '' }))
                          }}
                        />
                        {editErrors.company_name && <p className="text-xs text-red-500 mt-1">{editErrors.company_name}</p>}
                      </div>
                      <div>
                        <label className="form-label">Company Address</label>
                        <input
                          className="form-input"
                          value={editForm.company_address}
                          onChange={(event) => setEditForm((current) => ({ ...current, company_address: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Internship Position *</label>
                        <input
                          className="form-input"
                          value={editForm.internship_position}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, internship_position: value }))
                            setEditErrors((current) => ({ ...current, internship_position: '' }))
                          }}
                        />
                        {editErrors.internship_position && <p className="text-xs text-red-500 mt-1">{editErrors.internship_position}</p>}
                      </div>
                      <div>
                        <label className="form-label">Department / Unit</label>
                        <input
                          className="form-input"
                          value={editForm.department}
                          onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Supervisor Name *</label>
                        <input
                          className="form-input"
                          value={editForm.internship_supervisor}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, internship_supervisor: value }))
                            setEditErrors((current) => ({ ...current, internship_supervisor: '' }))
                          }}
                        />
                        {editErrors.internship_supervisor && <p className="text-xs text-red-500 mt-1">{editErrors.internship_supervisor}</p>}
                      </div>
                      <div>
                        <label className="form-label">Supervisor Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={editForm.internship_supervisor_email}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, internship_supervisor_email: value }))
                            setEditErrors((current) => ({ ...current, internship_supervisor_email: '' }))
                          }}
                        />
                        {editErrors.internship_supervisor_email && <p className="text-xs text-red-500 mt-1">{editErrors.internship_supervisor_email}</p>}
                      </div>
                      <div>
                        <label className="form-label">Start Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.start_date}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, start_date: value }))
                            setEditErrors((current) => ({ ...current, start_date: '' }))
                          }}
                        />
                        {editErrors.start_date && <p className="text-xs text-red-500 mt-1">{editErrors.start_date}</p>}
                      </div>
                      <div>
                        <label className="form-label">End Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.end_date}
                          onChange={(event) => {
                            const value = event.target.value
                            setEditForm((current) => ({ ...current, end_date: value }))
                            setEditErrors((current) => ({ ...current, end_date: '' }))
                          }}
                        />
                        {editErrors.end_date && <p className="text-xs text-red-500 mt-1">{editErrors.end_date}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input min-h-[90px] resize-none"
                        value={editForm.description}
                        onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
