import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Save, Calendar, Building2, FileText,
  MessageSquare, Download
} from 'lucide-react'
import { getAdminReportDetail, resolveApiUrl, updateAdminReportDetail } from '../api'

export default function AdminReportView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [comment, setComment] = useState('')
  const [score, setScore] = useState('')
  const [status, setStatus] = useState('Approved')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  const hasReportFile = Boolean(report?.reportFileSubmitted && report?.reportDownloadUrl)
  const canPreviewPdf = Boolean(report?.reportPreviewUrl)

  useEffect(() => {
    const loadReport = async () => {
      try {
        const payload = await getAdminReportDetail(id)
        setReport(payload)
        setComment(payload.feedback || '')
        setScore(payload.grade || '')
        if (payload.status === 'graded') {
          setStatus('Approved')
        } else {
          setStatus('Needs Revision')
        }
      } catch (err) {
        setError(err.message || 'Unable to load report.')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [id])

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Please add feedback before submitting.')
      return
    }

    if (score !== '') {
      const numericScore = Number(score)
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        alert('Score must be between 0 and 100.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = await updateAdminReportDetail(id, {
        decision: status,
        comment,
        grade: score,
      })
      setReport(payload)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Unable to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 800)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-gray-500">Loading report...</p>
      </div>
    )
  }

  if (!report || error) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Report not found</h1>
        <p className="mt-2 text-sm text-gray-500">{error || 'The requested report could not be found.'}</p>
        <button onClick={() => navigate('/admin/reports')} className="btn-primary mt-6">
          Back to Reports
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto mt-20 max-w-lg text-center animate-slide-up">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <CheckCircle size={38} className="text-primary-600" />
        </div>
        <h2 className="mb-2 font-heading text-xl font-bold text-gray-900">Feedback Submitted ✅</h2>
        <p className="mb-2 text-sm text-gray-500">
          Your review for <strong>{report.studentName}</strong>'s report has been recorded.
        </p>
        <p className="mb-6 text-sm">
          Status set to: <span className={`font-semibold ${status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span>
          {score !== '' && <> · Score: <span className="font-semibold text-primary-700">{score}/100</span></>}
        </p>
        <button onClick={() => navigate('/admin/reports')} className="btn-primary">
          ← Back to Reports
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] animate-fade-in flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <h2 className="font-heading text-sm font-bold text-gray-900">{report.title}</h2>
            <p className="text-xs text-gray-400">{report.studentName} · {report.studentId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-4 text-xs text-gray-500 sm:flex">
            <span className="flex items-center gap-1"><Building2 size={12} /> {report.company}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(report.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <span className="badge-warning ml-2">{report.status === 'graded' ? 'Reviewed' : 'Pending Review'}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-gradient-to-br from-primary-50 to-white p-5">
          <div className="mb-3 flex flex-shrink-0 items-center justify-between rounded-xl border border-primary-100 bg-white/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Submitted Report Document</p>
              <p className="text-xs text-gray-500">Preview directly in-app</p>
            </div>
            {hasReportFile ? (
              <a
                href={resolveApiUrl(report.reportDownloadUrl)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
              >
                <Download size={15} /> Download
              </a>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {hasReportFile && canPreviewPdf ? (
              <iframe
                title="Submitted report preview"
                src={`${resolveApiUrl(report.reportPreviewUrl)}#view=FitH`}
                className="h-full w-full"
              />
            ) : hasReportFile ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="max-w-md rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <p className="font-semibold">Preview unavailable for this file type.</p>
                  <p className="mt-1">Only PDF reports can be viewed directly in the app. Use the Download button above to open this file.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  No uploaded report file is attached yet.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-96 flex-shrink-0 flex-col overflow-hidden bg-white">
          <div className="border-b border-gray-100 bg-primary-50/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              <h3 className="font-heading font-semibold text-gray-800">Review & Feedback</h3>
            </div>
            <p className="mt-1 text-xs text-gray-400">Your feedback will be shared with the student</p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
                  {report.studentName.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-gray-800">{report.studentName}</p>
                  <p className="font-mono text-xs text-gray-400">{report.studentId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Building2 size={11} /> {report.company}</span>
                <span className="flex items-center gap-1"><FileText size={11} /> {report.type}</span>
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-100">
                  <CheckCircle size={11} className="text-primary-600" />
                </span>
                Review Decision *
              </label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Approved">✅ Approved</option>
                <option value="Needs Revision">🔄 Needs Revision</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>

            <div>
              <label className="form-label">Score (0 - 100)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="form-input"
                placeholder="e.g. 84"
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-100">
                  <MessageSquare size={11} className="text-sky-600" />
                </span>
                Feedback Comments *
              </label>
              <textarea
                className="form-input min-h-[140px] resize-none text-sm"
                placeholder="Provide detailed, constructive feedback to help the student improve..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{comment.length} chars</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Quick Snippets</p>
              <div className="flex flex-wrap gap-2">
                {['Excellent technical depth', 'Needs more detail', 'Good reflection', 'Improve structure', 'Well documented'].map((snippet) => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => setComment((c) => (c ? `${c}\n${snippet}` : snippet))}
                    className="rounded-lg border border-transparent bg-gray-100 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    + {snippet}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-2 border-t border-gray-100 bg-gray-50/40 px-5 py-4">
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Submit Feedback
                </span>
              )}
            </button>
            <button onClick={handleSaveDraft} className="btn-secondary w-full py-2.5">
              {saved ? (
                <span className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle size={14} /> Draft Saved!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save size={14} /> Save Draft
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
