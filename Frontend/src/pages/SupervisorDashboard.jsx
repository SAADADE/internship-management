import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatsCard from '../components/StatsCard'
import {
  Users, FileText, CheckCircle, Clock,
  Search, Eye, ChevronRight, AlertCircle
} from 'lucide-react'
import { getSupervisorLogs, getSupervisorStudents } from '../api'

const STATUS_BADGE = {
  'Reviewed':       'badge-success',
  'Pending':        'badge-warning',
  'Needs Revision': 'badge-danger',
}
const STATUS_DOT = {
  'Reviewed':       'bg-emerald-500',
  'Pending':        'bg-amber-400',
  'Needs Revision': 'bg-red-500',
}

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-primary-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-500', 'bg-rose-500', 'bg-teal-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center
                     text-xs font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function SupervisorDashboard() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    let active = true

    async function loadSupervisorData() {
      setLoading(true)
      setError('')
      try {
        const [studentsResponse, logsResponse] = await Promise.all([
          getSupervisorStudents(),
          getSupervisorLogs(),
        ])

        if (!active) return
        setStudents(Array.isArray(studentsResponse) ? studentsResponse : [])
        setLogs(Array.isArray(logsResponse) ? logsResponse : [])
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Unable to load supervisor dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSupervisorData()
    return () => {
      active = false
    }
  }, [])

  const studentByIndex = useMemo(() => {
    const map = new Map()
    students.forEach((student) => {
      if (student?.index_number) {
        map.set(student.index_number.toLowerCase(), student)
      }
    })
    return map
  }, [students])

  const entries = useMemo(() => {
    return logs.map((logItem) => {
      const indexFromLog = logItem?.student_index_number || ''
      const matchedStudent = studentByIndex.get(indexFromLog.toLowerCase())
      const studentFirstName = matchedStudent?.first_name || ''
      const studentLastName = matchedStudent?.last_name || ''
      const studentNameFromProfile = `${studentFirstName} ${studentLastName}`.trim()
      const studentName =
        logItem?.student_name ||
        studentNameFromProfile ||
        matchedStudent?.sch_email ||
        'Unknown Student'
      const studentIndex = indexFromLog || matchedStudent?.index_number || '-'
      const submittedDate = logItem?.date || logItem?.created_at || null

      let status = 'Pending'
      if (logItem?.status === 'reviewed') status = 'Reviewed'
      if (logItem?.status === 'needs_revision') status = 'Needs Revision'

      return {
        id: logItem?.id,
        name: studentName,
        index: studentIndex,
        title: `Weekly Log Sheet - Week ${logItem?.week_number || 1}`,
        date: submittedDate,
        status,
        company: logItem?.company_name || '-',
      }
    })
  }, [logs, studentByIndex])

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const query = search.toLowerCase().trim()
      const matchSearch =
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.title.toLowerCase().includes(query) ||
        entry.index.toLowerCase().includes(query)
      const matchStatus = filter === 'All' || entry.status === filter
      return matchSearch && matchStatus
    })
  }, [entries, filter, search])

  const pending = entries.filter((entry) => entry.status === 'Pending').length
  const reviewed = entries.filter((entry) => entry.status === 'Reviewed').length
  const revise = entries.filter((entry) => entry.status === 'Needs Revision').length

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Welcome banner */}
      <div className="card p-6 bg-gradient-to-br from-primary-900 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="absolute right-10 -bottom-12 w-60 h-60 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-primary-200 text-sm mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="font-heading text-2xl font-bold">Supervisor Dashboard</h2>
          <p className="text-primary-200 text-sm mt-2">
            You have <span className="text-white font-semibold">{pending} reports</span> awaiting
            your review today.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Students" value={students.length} color="green" trendLabel="Assigned to you" />
        <StatsCard icon={Clock} label="Pending Reviews" value={pending} color="amber" trendLabel="Needs your attention" />
        <StatsCard icon={CheckCircle} label="Completed Reviews" value={reviewed} color="blue" trendLabel="Approved logs" />
        <StatsCard icon={AlertCircle} label="Needs Revision" value={revise} color="red" trendLabel="Returned logs" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="form-input pl-9 text-sm"
              placeholder="Search by student name or report title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Reviewed', 'Needs Revision'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap
                  ${filter === status
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {status} {status === 'Pending' && pending > 0 && (
                  <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                {['Student', 'Report Title', 'Company', 'Submitted', 'Status', 'Action'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 text-sm font-body">
                    Loading assigned students and logs...
                  </td>
                </tr>
              ) : null}
              {!loading && error ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-red-500 text-sm font-body">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 text-sm font-body">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    No submissions from your assigned internships match your filter
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                  >
                    {/* Student */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.name} />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm font-body">{s.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{s.index}</p>
                        </div>
                      </div>
                    </td>
                    {/* Title */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={11} className="text-primary-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-body">{s.title}</span>
                      </div>
                    </td>
                    {/* Company */}
                    <td className="table-cell text-gray-500 text-sm">{s.company}</td>
                    {/* Date */}
                    <td className="table-cell text-gray-500 text-sm whitespace-nowrap">
                      {s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    {/* Status */}
                    <td className="table-cell">
                      <span className={`${STATUS_BADGE[s.status]} flex items-center gap-1.5 w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                        {s.status}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="table-cell">
                      <button
                        onClick={() => navigate(`/supervisor/review/${s.id}`)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
                          transition-colors
                          ${s.status === 'Pending'
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        <Eye size={13} />
                        {s.status === 'Pending' ? 'Review Now' : 'View'}
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-body">
            Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> submissions
          </p>
          <p className="text-xs text-gray-400 font-body">Assigned students: <strong>{students.length}</strong></p>
        </div>
      </div>
    </div>
  )
}
