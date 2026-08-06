import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAdminAppraisalDetail } from '../api'

const RATING_LABELS = {
  '5': 'Excellent (5)',
  '4': 'Very Good (4)',
  '3': 'Good (3)',
  '2': 'Fair (2)',
  '1': 'Poor (1)'
}

export default function AdminAppraisalView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [appraisal, setAppraisal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppraisal = async () => {
      try {
        const payload = await getAdminAppraisalDetail(id)
        setAppraisal(payload)
      } catch (err) {
        setError(err.message || 'Unable to load appraisal form.')
      } finally {
        setLoading(false)
      }
    }

    loadAppraisal()
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-gray-500">Loading appraisal details...</p>
      </div>
    )
  }

  if (!appraisal || error) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Appraisal not found</h1>
        <p className="mt-2 text-sm text-gray-500">{error || 'The requested appraisal form could not be found.'}</p>
        <button onClick={() => navigate('/admin/reports')} className="btn-primary mt-6">
          Back to Reports
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Back to reports
        </button>
      </div>

      <div className="card p-8">
        <div className="mb-6 flex flex-col gap-2 border-b border-gray-100 pb-4">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Intern Appraisal Form</h1>
          <p className="text-sm text-gray-500">Submitted by {appraisal.supervisorName} on {new Date(appraisal.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Student</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.studentName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Index Number</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.studentId}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Department</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.department}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Date</p>
              <p className="mt-1 text-sm text-gray-600">{new Date(appraisal.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Evaluation Criteria for the Supervisor</h2>
          {appraisal.criteria.map((criterion) => (
            <div key={criterion.key} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-gray-700">{criterion.label}</p>
                <span className="inline-flex w-fit rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                  {RATING_LABELS[criterion.score] || criterion.score}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800">General Comments</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{appraisal.generalComments}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800">Supervisor Details</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Supervisor</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.supervisorName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Position</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.position}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Signature</p>
              <p className="mt-1 text-sm text-gray-600">{appraisal.signature}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Date</p>
              <p className="mt-1 text-sm text-gray-600">{new Date(appraisal.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
