import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Mail, Briefcase, Calendar, MapPin, CheckCircle, Download, FileText } from 'lucide-react'
import { getAdminStudentDetail, resolveApiUrl } from '../api'

export default function AdminStudentView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const payload = await getAdminStudentDetail(id)
        setStudent(payload)
      } catch (err) {
        setError(err.message || 'Unable to load student details.')
      } finally {
        setLoading(false)
      }
    }

    loadStudent()
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-gray-500">Loading student details...</p>
      </div>
    )
  }

  if (!student || error) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Student not found</h1>
        <p className="mt-2 text-sm text-gray-500">{error || 'The requested student profile could not be found.'}</p>
        <button onClick={() => navigate('/admin/students')} className="btn-primary mt-6">
          Back to Students
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Back to students
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <GraduationCap size={28} className="text-primary-600" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="font-mono text-sm text-gray-500">{student.studentId}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${student.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {student.status === 'completed' ? 'Completed' : 'Active'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Email</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" /> {student.email}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Phone</p>
              <p className="mt-1 text-sm text-gray-600">{student.phone}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Department</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap size={14} className="text-gray-400" /> {student.department}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Location</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" /> {student.address}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800">Internship Overview</h2>
            <p className="mt-3 text-sm text-gray-600">{student.summary}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Placement Details</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Briefcase size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Company</p>
                  <p>{student.company}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Dates</p>
                  <p>{new Date(student.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(student.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Supervisor</p>
                  <p>{student.supervisor}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Progress Status</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Final Report</span>
                  <span className="text-sm font-semibold text-primary-700">{student.reportStatus}</span>
                </div>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  {student.reportFileSubmitted ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm text-emerald-700">
                        <FileText size={14} /> File submitted: {student.reportFileName}
                      </p>
                      <a
                        href={resolveApiUrl(student.reportDownloadUrl)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                      >
                        <Download size={14} /> Download report file
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No final report file has been uploaded yet.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Appraisal Form</span>
                  <span className="text-sm font-semibold text-primary-700">{student.appraisalStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Key Achievements</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {student.achievements.map((achievement) => (
                <li key={achievement} className="flex items-start gap-2">
                  <CheckCircle size={14} className="mt-0.5 text-emerald-500" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
