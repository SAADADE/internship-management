import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, ClipboardCheck, Eye } from 'lucide-react'
import { getAdminReportsIndex } from '../api'

export default function AdminReports() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [finalReports, setFinalReports] = useState([])
  const [appraisalForms, setAppraisalForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadReports = async () => {
      setError('')
      try {
        const payload = await getAdminReportsIndex()
        setFinalReports(Array.isArray(payload?.finalReports) ? payload.finalReports : [])
        setAppraisalForms(Array.isArray(payload?.appraisalForms) ? payload.appraisalForms : [])
      } catch (err) {
        setError(err.message || 'Unable to load reports and appraisals.')
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [])

  const filteredFinalReports = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return finalReports.filter((report) =>
      report.studentName.toLowerCase().includes(query) ||
      report.studentId.toLowerCase().includes(query) ||
      report.department.toLowerCase().includes(query)
    )
  }, [searchTerm, finalReports])

  const filteredAppraisals = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return appraisalForms.filter((form) =>
      form.studentName.toLowerCase().includes(query) ||
      form.studentId.toLowerCase().includes(query) ||
      form.supervisorName.toLowerCase().includes(query)
    )
  }, [searchTerm, appraisalForms])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Student Final Reports & Appraisals</h1>
        <p className="text-gray-500">Review submitted final reports from students and appraisal forms from supervisors.</p>
      </div>

      <div className="card p-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, ID, department, or supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary-600" />
              <h2 className="section-title">Student Final Reports</h2>
            </div>
          </div>

          {filteredFinalReports.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">{loading ? 'Loading final reports...' : 'No final reports found.'}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFinalReports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{report.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{report.studentId}</p>
                      <p className="mt-2 text-sm text-gray-600">{report.title}</p>
                      <p className="text-xs text-gray-400">Department: {report.department}</p>
                      <p className="text-xs text-gray-400">File: {report.hasFile ? 'Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <span className={report.hasFile ? 'badge-success' : 'badge-warning'}>{report.hasFile ? 'File Submitted' : 'Pending File'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">Submitted on {new Date(report.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <button type="button" onClick={() => navigate(`/admin/reports/${report.id}`)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                      <Eye size={14} /> View report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-primary-600" />
              <h2 className="section-title">Supervisor Appraisal Forms</h2>
            </div>
          </div>

          {filteredAppraisals.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">{loading ? 'Loading appraisal forms...' : 'No appraisal forms found.'}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppraisals.map((form) => (
                <div key={form.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{form.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{form.studentId}</p>
                      <p className="mt-2 text-sm text-gray-600">Supervisor: {form.supervisorName}</p>
                    </div>
                    <span className="badge-info">Received</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">Submitted on {new Date(form.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <button type="button" onClick={() => navigate(`/admin/appraisals/${form.id}`)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                      <Eye size={14} /> View form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  )
}
