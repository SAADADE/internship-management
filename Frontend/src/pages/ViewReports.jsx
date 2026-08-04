import { useEffect, useState } from 'react'
import { Eye, Download, Search, FileText } from 'lucide-react'
import { getStudentReports, generateStudentReport } from '../api'

const STATUS_BADGE = {
  'Reviewed': 'badge-success',
  'Pending': 'badge-warning',
  'Submitted': 'badge-info',
  'Draft': 'badge-warning',
  'Needs Revision': 'badge-danger',
}

const STATUS_DOT = {
  'Reviewed': 'bg-emerald-500',
  'Pending': 'bg-amber-400',
  'Submitted': 'bg-sky-500',
  'Draft': 'bg-gray-400',
  'Needs Revision': 'bg-red-500',
}

const normalizeStatus = value => {
  if (!value) return 'Pending'
  const key = String(value).trim()
  if (key === 'Reviewed' || key === 'reviewed') return 'Reviewed'
  if (key === 'Pending' || key === 'pending') return 'Pending'
  if (key === 'Submitted' || key === 'submitted') return 'Submitted'
  if (key === 'Draft' || key === 'draft') return 'Draft'
  if (key === 'Needs Revision' || key === 'needs_revision') return 'Needs Revision'
  return key
}

const formatDate = value => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

export default function ViewReports() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    let mounted = true

    getStudentReports()
      .then(data => {
        if (mounted) {
          setReports(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message || 'Unable to load reports.')
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const filtered = reports.filter(r => {
    const searchText = `${r.title || ''} ${r.company_name || ''}`.toLowerCase()
    const matchSearch = searchText.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || normalizeStatus(r.status) === statusFilter
    return matchSearch && matchStatus
  })

  const handleDownload = async (item, event) => {
    event.stopPropagation()
    if (item.source !== 'report') {
      setError('Only generated reports can be downloaded from this view.')
      return
    }

    setDownloadingId(item.id)
    setError('')

    try {
      const blob = await generateStudentReport()
      const safeName = (item.title || 'internship_report')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'internship_report'
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeName}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setSelected(item)
    } catch (err) {
      setError(err.message || 'Unable to download report.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Submitted', value: reports.length, color: 'bg-primary-50 text-primary-800' },
          { label: 'Reviewed', value: reports.filter(r => normalizeStatus(r.status) === 'Reviewed').length, color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Pending', value: reports.filter(r => ['Pending', 'Submitted', 'Draft'].includes(normalizeStatus(r.status))).length, color: 'bg-amber-50 text-amber-800' },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center justify-between ${s.color}`}>
            <span className="text-sm font-medium font-body">{s.label}</span>
            <span className="font-heading text-xl font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="form-input pl-9 text-sm"
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Reviewed', 'Pending', 'Needs Revision'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors
                  ${statusFilter === s
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="p-5 text-sm text-gray-500">Loading reports…</div>
        )}

        {error && !loading && (
          <div className="p-5 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                {['Entry', 'Type', 'Company', 'Date Submitted', 'Status', 'Grade', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-gray-400 font-body text-sm">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    No reports found
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer
                      ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                          <FileText size={13} className="text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-800 font-body text-sm">{r.title}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{r.type}</td>
                    <td className="table-cell text-gray-500">{r.company_name || '—'}</td>
                    <td className="table-cell text-gray-500">{formatDate(r.date)}</td>
                    <td className="table-cell">
                      <span className={`${STATUS_BADGE[normalizeStatus(r.status)] || 'badge-warning'} flex items-center gap-1.5 w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[normalizeStatus(r.status)] || 'bg-amber-400'}`} />
                        {normalizeStatus(r.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-bold font-heading ${r.grade === '-' ? 'text-gray-300' : 'text-primary-700'}`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(r) }}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800
                                     font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary-50"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={e => handleDownload(r, e)}
                          disabled={r.source !== 'report' || downloadingId === r.id}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700
                                     font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Download size={13} /> {downloadingId === r.id ? 'Downloading…' : 'Download'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Feedback panel */}
      {selected && (
        <div className="card p-6 border-l-4 border-primary-500 animate-slide-up">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">{selected.title}</h3>
          <div className="flex gap-3 flex-wrap mb-4">
            <span className={STATUS_BADGE[normalizeStatus(selected.status)] || 'badge-warning'}>{normalizeStatus(selected.status)}</span>
            {selected.grade !== '-' && (
              <span className="badge-success">Grade: {selected.grade}</span>
            )}
          </div>
          {selected.company_name && (
            <p className="text-sm text-gray-600 mb-3">Company: {selected.company_name}</p>
          )}
          {selected.feedback ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Supervisor Feedback</p>
              <p className="text-sm text-gray-700 font-body">{selected.feedback}</p>
            </div>
          ) : selected.details ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Submission Details</p>
              <p className="text-sm text-gray-700 font-body">{selected.details}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic font-body">No feedback yet. Awaiting supervisor review.</p>
          )}
          <button onClick={() => setSelected(null)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
