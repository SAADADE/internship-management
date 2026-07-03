import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatsCard from '../components/StatsCard'
import {
  Users, FileText, CheckCircle, Clock,
  Search, Eye, ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react'

const STUDENTS = [
  { id: 1, name: 'Peter Nyarko',   index: 'CS/0241/19', title: 'Weekly Log Sheet — Week 4',  date: '2024-03-11', status: 'Pending',   company: 'Ghana Revenue Authority' },
  { id: 2, name: 'Abena Asante',   index: 'CS/0198/19', title: 'Weekly Log Sheet -Week 3',      date: '2024-03-08', status: 'Pending',   company: 'MTN Ghana' },
  { id: 3, name: 'Carl Tsidi',    index: 'CS/0312/19', title: 'Weekly Log Sheet — Week 9',     date: '2024-03-06', status: 'Reviewed',  company: 'Vodafone Ghana' },
  { id: 4, name: 'Ama Boateng',    index: 'CS/0267/19', title: 'Weekly Log Sheet - Week 5', date: '2024-03-04', status: 'Reviewed',  company: 'KPMG Ghana' },
  { id: 5, name: 'Tettey Ara Dede',  index: 'CS/0155/19', title: 'Weekly Log Sheet - Week 7',       date: '2024-02-28', status: 'Needs Revision', company: 'Ecobank Ghana' },
  { id: 6, name: 'Efua Mensah',    index: 'CS/0389/19', title: 'Weekly Log Sheet — Week 8',     date: '2024-02-25', status: 'Reviewed',  company: 'Tullow Oil Ghana' },
]

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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = STUDENTS.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filter === 'All' || s.status === filter
    return matchSearch && matchStatus
  })

  const pending  = STUDENTS.filter(s => s.status === 'Pending').length
  const reviewed = STUDENTS.filter(s => s.status === 'Reviewed').length
  const revise   = STUDENTS.filter(s => s.status === 'Needs Revision').length

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
          <h2 className="font-heading text-2xl font-bold">Supervisor Dashboard 📋</h2>
          <p className="text-primary-200 text-sm mt-2">
            You have <span className="text-white font-semibold">{pending} reports</span> awaiting
            your review today.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users}        label="Total Students"    value={STUDENTS.length} color="green"  trendLabel="Active this semester" />
        <StatsCard icon={Clock}        label="Pending Reviews"   value={pending}         color="amber"  trendLabel="Needs your attention" />
        <StatsCard icon={CheckCircle}  label="Completed Reviews" value={reviewed}        color="blue"   trend={8} trendLabel="vs last week" />
        <StatsCard icon={AlertCircle}  label="Needs Revision"    value={revise}          color="red"    trendLabel="Sent back to students" />
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
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Reviewed', 'Needs Revision'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap
                  ${filter === s
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s} {s === 'Pending' && pending > 0 && (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 text-sm font-body">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    No submissions match your filter
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
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
                      {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-body">
            Showing <strong>{filtered.length}</strong> of <strong>{STUDENTS.length}</strong> submissions
          </p>
          <div className="flex items-center gap-1">
            {[1].map(p => (
              <button key={p} className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-semibold">
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
