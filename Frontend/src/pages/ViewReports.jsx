import { useState } from 'react'
import { Eye, Download, Search, Filter, FileText, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const REPORTS = [
  { id: 1, title: 'Industrial Training Report — Week 1', type: 'Weekly Log Sheet',    date: '2024-02-05', status: 'Reviewed',         grade: 'A',  feedback: 'Excellent work. Very detailed logs.' },
  { id: 2, title: 'Vacation Training Report — Week 2',   type: 'Weekly Log Sheet',     date: '2024-02-19', status: 'Reviewed',         grade: 'B+', feedback: 'Good progress. Improve technical depth.' },
  { id: 3, title: 'Industrial Training Report — Week 3', type: 'Weekly Log Sheet',    date: '2024-03-04', status: 'Needs Revision',   grade: '-',  feedback: 'Revisions needed on section 3.' },
  { id: 4, title: 'Industrial Training Report — Week 4', type: 'Weekly Log Sheet',    date: '2024-03-11', status: 'Pending',          grade: '-',  feedback: '' },
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

export default function ViewReports() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const filtered = REPORTS.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Submitted', value: REPORTS.length, color: 'bg-primary-50 text-primary-800' },
          { label: 'Reviewed',        value: REPORTS.filter(r => r.status === 'Reviewed').length, color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Pending',         value: REPORTS.filter(r => r.status === 'Pending').length,  color: 'bg-amber-50 text-amber-800' },
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                {['Report Title', 'Type', 'Date Submitted', 'Status', 'Grade', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 font-body text-sm">
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
                    <td className="table-cell text-gray-500">
                      {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="table-cell">
                      <span className={`${STATUS_BADGE[r.status]} flex items-center gap-1.5 w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                        {r.status}
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
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700
                                     font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback panel */}
      {selected && (
        <div className="card p-6 border-l-4 border-primary-500 animate-slide-up">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">{selected.title}</h3>
          <div className="flex gap-3 flex-wrap mb-4">
            <span className={STATUS_BADGE[selected.status]}>{selected.status}</span>
            {selected.grade !== '-' && (
              <span className="badge-success">Grade: {selected.grade}</span>
            )}
          </div>
          {selected.feedback ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Supervisor Feedback</p>
              <p className="text-sm text-gray-700 font-body">{selected.feedback}</p>
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
