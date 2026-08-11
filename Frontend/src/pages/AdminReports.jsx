import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { getAdminReportsIndex } from '../api'

export default function AdminReports() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [finalReports, setFinalReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadReports = async () => {
      setError('')
      try {
        const payload = await getAdminReportsIndex()
        setFinalReports(Array.isArray(payload?.finalReports) ? payload.finalReports : [])
      } catch (err) {
        setError(err.message || 'Unable to load reports and appraisals.')
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [])

  const tableRows = useMemo(() => {
    return [...finalReports].sort((a, b) => {
      const aDate = new Date(a.submittedOn).getTime()
      const bDate = new Date(b.submittedOn).getTime()
      return bDate - aDate
    })
  }, [finalReports])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return tableRows

    return tableRows.filter((row) =>
      row.studentName.toLowerCase().includes(query) ||
      row.studentId.toLowerCase().includes(query) ||
      row.department.toLowerCase().includes(query) ||
      (row.appraisalSupervisor || '').toLowerCase().includes(query) ||
      'final report'.includes(query)
    )
  }, [searchTerm, tableRows])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Student Final Reports & Appraisals</h1>
        <p className="text-gray-500">Review submitted final reports from students and appraisal forms from supervisors.</p>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by type, student name, ID, department, or supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header text-left">Student</th>
                <th className="table-header text-left">Student ID</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Report</th>
                <th className="table-header text-left">Report Status</th>
                <th className="table-header text-left">Report Submitted</th>
                <th className="table-header text-left">Appraisal</th>
                <th className="table-header text-left">Supervisor</th>
                <th className="table-header text-left">Appraisal Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-700">{row.studentName}</td>
                  <td className="table-cell font-mono text-xs text-gray-600">{row.studentId}</td>
                  <td className="table-cell text-gray-600">{row.department || '-'}</td>
                  <td className="table-cell text-gray-500">
                    <button
                      type="button"
                      onClick={() => navigate(row.reportViewPath)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
                    >
                      <Eye size={14} /> View report
                    </button>
                  </td>
                  <td className="table-cell">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {row.hasFile ? 'File Submitted' : 'Pending File'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">
                    {new Date(row.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="table-cell">
                    {row.appraisalSubmitted ? (
                      <button
                        type="button"
                        onClick={() => navigate(row.appraisalViewPath)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
                      >
                        <Eye size={14} /> View appraisal
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Not submitted</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-600">{row.appraisalSupervisor || '-'}</td>
                  <td className="table-cell text-gray-500">
                    {row.appraisalSubmittedOn
                      ? new Date(row.appraisalSubmittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-'}
                  </td>
                </tr>
              ))}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-cell py-10 text-center text-sm text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={8} className="table-cell py-10 text-center text-sm text-gray-500">
                    Loading records...
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
