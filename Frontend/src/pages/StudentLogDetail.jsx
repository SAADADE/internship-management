import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Building2, Pencil, Save, Trash2, X } from 'lucide-react'
import { deleteStudentLog, getStudentLog, updateStudentLog } from '../api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function statusLabel(status) {
  if (!status) return 'Submitted'
  if (status === 'reviewed') return 'Reviewed'
  if (status === 'needs_revision') return 'Needs Revision'
  if (status === 'draft') return 'Draft'
  return 'Submitted'
}

function statusBadge(status) {
  if (status === 'reviewed') return 'badge-success'
  if (status === 'needs_revision') return 'badge-danger'
  if (status === 'draft') return 'badge-warning'
  return 'badge-info'
}

function mapEntriesToForm(entries) {
  const state = {
    achievements: '',
    summary: '',
    week_number: '',
    start_date: '',
    end_date: '',
  }

  DAYS.forEach((day) => {
    const key = day.toLowerCase()
    state[`${key}Tasks`] = ''
    state[`${key}Skills`] = ''
    state[`${key}Challenges`] = ''
    state[`${key}Solutions`] = ''
  })

  ;(entries || []).forEach((entry) => {
    const rawDay = String(entry?.day || '').trim().toLowerCase()
    const key = rawDay
    if (!DAYS.map((d) => d.toLowerCase()).includes(key)) return
    state[`${key}Tasks`] = entry?.tasks || ''
    state[`${key}Skills`] = entry?.skills || ''
    state[`${key}Challenges`] = entry?.challenges || ''
    state[`${key}Solutions`] = entry?.solutions || ''
  })

  return state
}

function buildDailyEntriesFromForm(form) {
  return DAYS.map((day) => {
    const key = day.toLowerCase()
    return {
      day,
      tasks: form[`${key}Tasks`] || '',
      skills: form[`${key}Skills`] || '',
      challenges: form[`${key}Challenges`] || '',
      solutions: form[`${key}Solutions`] || '',
    }
  })
}

export default function StudentLogDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [log, setLog] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const reviewed = log?.status === 'reviewed'

  useEffect(() => {
    let active = true

    async function loadLog() {
      setLoading(true)
      setError('')
      try {
        const data = await getStudentLog(id)
        if (!active) return
        setLog(data)
        setForm({
          ...mapEntriesToForm(data?.daily_entries || []),
          achievements: data?.achievements || '',
          summary: data?.content || '',
          week_number: data?.week_number || '',
          start_date: data?.start_date || '',
          end_date: data?.end_date || '',
        })
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Unable to load log details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (id) {
      loadLog()
    } else {
      setLoading(false)
      setError('Invalid log id.')
    }

    return () => {
      active = false
    }
  }, [id])

  const submissionDate = useMemo(() => formatDate(log?.date || log?.created_at), [log])

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancelEdit = () => {
    if (!log) return
    setForm({
      ...mapEntriesToForm(log?.daily_entries || []),
      achievements: log?.achievements || '',
      summary: log?.content || '',
      week_number: log?.week_number || '',
      start_date: log?.start_date || '',
      end_date: log?.end_date || '',
    })
    setIsEditing(false)
    setMessage('')
    setError('')
  }

  const handleSave = async () => {
    if (!form || !log) return

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        week_number: form.week_number || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        achievements: form.achievements || '',
        content: form.summary || '',
        daily_entries: buildDailyEntriesFromForm(form),
      }

      const updated = await updateStudentLog(id, payload)
      setLog(updated)
      setForm({
        ...mapEntriesToForm(updated?.daily_entries || []),
        achievements: updated?.achievements || '',
        summary: updated?.content || '',
        week_number: updated?.week_number || '',
        start_date: updated?.start_date || '',
        end_date: updated?.end_date || '',
      })
      setIsEditing(false)
      setMessage('Weekly log updated successfully.')
    } catch (err) {
      setError(err?.message || 'Unable to update this log.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!log) return

    const confirmed = window.confirm('Delete this weekly log? This action cannot be undone.')
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setMessage('')
    try {
      await deleteStudentLog(id)
      navigate('/reports')
    } catch (err) {
      setError(err?.message || 'Unable to delete this log.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="card p-6 text-sm text-gray-500">Loading weekly log...</div>
  }

  if (error && !log) {
    return (
      <div className="card p-6 space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/reports" className="btn-secondary inline-flex">
          Back to Weekly Logs
        </Link>
      </div>
    )
  }

  if (!log || !form) {
    return (
      <div className="card p-6">
        <p className="text-sm text-gray-500">Log not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
          <ArrowLeft size={16} />
          Back to Weekly Logs
        </Link>

        {!reviewed && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancelEdit} className="btn-secondary inline-flex items-center gap-1.5">
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setIsEditing(true)} className="btn-secondary inline-flex items-center gap-1.5">
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Weekly Log - Week {form.week_number || log.week_number || 1}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {submissionDate}</span>
            <span className="inline-flex items-center gap-1.5"><Building2 size={14} /> {log.company_name || '-'}</span>
            <span className={statusBadge(log.status)}>{statusLabel(log.status)}</span>
          </div>
          {reviewed && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
              Reviewed logs are locked and cannot be edited or deleted.
            </p>
          )}
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="form-label">Week Number</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={form.week_number || ''}
              onChange={(e) => handleFieldChange('week_number', e.target.value)}
              readOnly={!isEditing}
            />
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={form.start_date || ''}
              onChange={(e) => handleFieldChange('start_date', e.target.value)}
              readOnly={!isEditing}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={form.end_date || ''}
              onChange={(e) => handleFieldChange('end_date', e.target.value)}
              readOnly={!isEditing}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Daily Entries</h2>
          {DAYS.map((day) => {
            const key = day.toLowerCase()
            return (
              <div key={day} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">{day}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tasks</label>
                    <textarea
                      className="form-input min-h-[90px] resize-y"
                      value={form[`${key}Tasks`] || ''}
                      onChange={(e) => handleFieldChange(`${key}Tasks`, e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="form-label">Skills</label>
                    <textarea
                      className="form-input min-h-[90px] resize-y"
                      value={form[`${key}Skills`] || ''}
                      onChange={(e) => handleFieldChange(`${key}Skills`, e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="form-label">Challenges</label>
                    <textarea
                      className="form-input min-h-[90px] resize-y"
                      value={form[`${key}Challenges`] || ''}
                      onChange={(e) => handleFieldChange(`${key}Challenges`, e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="form-label">Solutions</label>
                    <textarea
                      className="form-input min-h-[90px] resize-y"
                      value={form[`${key}Solutions`] || ''}
                      onChange={(e) => handleFieldChange(`${key}Solutions`, e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <label className="form-label">Achievements</label>
          <textarea
            className="form-input min-h-[110px] resize-y"
            value={form.achievements || ''}
            onChange={(e) => handleFieldChange('achievements', e.target.value)}
            readOnly={!isEditing}
          />
        </div>

        <div>
          <label className="form-label">Summary</label>
          <textarea
            className="form-input min-h-[110px] resize-y"
            value={form.summary || ''}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            readOnly={!isEditing}
          />
        </div>
      </div>
    </div>
  )
}
