import { useEffect, useMemo, useState } from 'react'
import { FileText, Search, Filter, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSupervisorReports } from '../api'

export default function SupervisorReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWeek, setFilterWeek] = useState('all')

  useEffect(() => {
    let active = true

    async function loadReports() {
      setLoading(true)
      setError('')
      try {
        const response = await getSupervisorReports()
        if (!active) return
        setReports(Array.isArray(response) ? response : [])
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Unable to fetch reports.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadReports()
    return () => {
      active = false
    }
  }, [])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const query = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !query ||
        report.studentName.toLowerCase().includes(query) ||
        report.studentId.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query)

      const matchesStatus = filterStatus === 'all' || report.status === filterStatus
      const matchesWeek = filterWeek === 'all' || report.reportWeek === filterWeek

      return matchesSearch && matchesStatus && matchesWeek
    })
  }, [reports, searchTerm, filterStatus, filterWeek])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="badge-success">Reviewed</span>
      case 'pending':
        return <span className="badge-warning">Pending Review</span>
      case 'needs_revision':
        return <span className="badge-error">Needs Revision</span>
      case 'late':
        return <span className="badge-error">Late Submission</span>
      default:
        return null
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircle size={16} className="text-emerald-600" />
      case 'pending':
        return <Clock size={16} className="text-amber-600" />
      case 'needs_revision':
        return <AlertCircle size={16} className="text-red-600" />
      case 'late':
        return <AlertCircle size={16} className="text-red-600" />
      default:
        return null
    }
  }

  const isOverdue = (dueDate) => new Date(dueDate) < new Date()

  const weeks = useMemo(() => {
    const weekSet = new Set(reports.map((item) => item.reportWeek).filter(Boolean))
    return Array.from(weekSet).sort((a, b) => {
      const aNum = Number((a || '').replace(/[^0-9]/g, '')) || 0
      const bNum = Number((b || '').replace(/[^0-9]/g, '')) || 0
      return aNum - bNum
    })
  }, [reports])

  const pendingCount = reports.filter((r) => r.status === 'pending').length
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Weekly Reports</h1>
          <p className="text-gray-500 mt-1">Review and manage student internship reports</p>
        </div>
        <div className="flex gap-3">
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or report title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'reviewed', 'needs_revision', 'late'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Status' : status === 'needs_revision' ? 'Needs Revision' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {['all', ...weeks].map(week => (
              <button
                key={week}
                onClick={() => setFilterWeek(week)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterWeek === week
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {week === 'all' ? 'All Weeks' : week}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No reports found</p>
            <p className="text-sm text-gray-400">There are no reports for your assigned internships matching the current filter.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-200">
              <tr>
                <th className="table-header text-left">Student</th>
                <th className="table-header text-left">Report</th>
                <th className="table-header text-left">Week</th>
                <th className="table-header text-left">Company</th>
                <th className="table-header text-center">Submitted</th>
                <th className="table-header text-center">Due</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Rating</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report, idx) => (
                <tr key={report.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 ? 'bg-gray-50/30' : ''}`}>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{report.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{report.studentId}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-gray-900">{report.title}</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-700 font-medium">{report.reportWeek}</span>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-gray-700">{report.company}</p>
                  </td>
                  <td className="table-cell text-center">
                    <p className="text-xs text-gray-500">
                      {new Date(report.submissionDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </p>
                  </td>
                  <td className="table-cell text-center">
                    <p className={`text-xs font-medium ${isOverdue(report.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
                      {new Date(report.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </p>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(report.status)}
                      {getStatusBadge(report.status)}
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    {report.status === 'pending' || report.status === 'late' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < report.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <button
                      onClick={() => navigate(`/supervisor/review/${report.id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors text-xs font-medium"
                    >
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reports.length}</p>
            </div>
            <FileText size={32} className="text-primary-200" />
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <Clock size={32} className="text-amber-200" />
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Reviewed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{reviewedCount}</p>
            </div>
            <CheckCircle size={32} className="text-emerald-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
