import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Building2,
  FileText,
  MessageSquare,
  Star,
} from 'lucide-react'
import { getSupervisorLog, updateSupervisorLog } from '../api'

function getStudentInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'ST'
  return parts.map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function mapDecisionToStatus(decision) {
  return decision === 'approved' ? 'Approved' : 'Needs Revision'
}

function mapStatusToDecision(status) {
  return status === 'Approved' ? 'approved' : 'rejected'
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === '') return ''
  const numeric = Number(score)
  if (!Number.isFinite(numeric)) return ''
  const rounded = Math.round(numeric)

  // Backward compatibility for previously saved 0-100 scores.
  if (rounded > 5) {
    return String(Math.max(1, Math.min(5, Math.round(rounded / 20))))
  }
  return String(Math.max(1, Math.min(5, rounded)))
}

export default function ReportReview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [logData, setLogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [comment, setComment] = useState('')
  const [grade, setGrade] = useState('')
  const [status, setStatus] = useState('Approved')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true

    async function loadLog() {
      setLoading(true)
      setLoadingError('')
      try {
        const response = await getSupervisorLog(id)
        if (!active) return

        setLogData(response)
        if (response?.feedback?.comment) {
          setComment(response.feedback.comment)
        }
        if (response?.feedback?.decision) {
          setStatus(mapDecisionToStatus(response.feedback.decision))
        }
        if (response?.feedback?.score !== null && response?.feedback?.score !== undefined) {
          setGrade(normalizeScore(response.feedback.score))
        }
      } catch (err) {
        if (!active) return
        setLoadingError(err?.message || 'Unable to load report details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (id) {
      loadLog()
    } else {
      setLoading(false)
      setLoadingError('Invalid report id.')
    }

    return () => {
      active = false
    }
  }, [id])

  const display = useMemo(() => {
    if (!logData) {
      return {
        student: 'Student',
        index: '-',
        company: '-',
        submitted: null,
        title: 'Weekly Log Sheet',
        type: 'Weekly Log Sheet',
        prevStatus: 'Pending',
        weekLabel: 'Week 1',
        entries: [],
        achievements: '',
        content: '',
      }
    }

    const studentName = logData.student_name || 'Student'
    const studentIndex = logData.student_index_number || '-'
    const companyName = logData.company_name || '-'
    const weekLabel = `Week ${logData.week_number || 1}`
    const title = `${weekLabel} - Weekly Log Sheet`

    let prevStatus = 'Pending'
    if (logData.status === 'reviewed') prevStatus = 'Reviewed'
    if (logData.status === 'needs_revision') prevStatus = 'Needs Revision'

    const entries = Array.isArray(logData.daily_entries) ? logData.daily_entries : []

    return {
      student: studentName,
      index: studentIndex,
      company: companyName,
      submitted: logData.date || logData.created_at || null,
      title,
      type: 'Weekly Log Sheet',
      prevStatus,
      weekLabel,
      entries,
      achievements: logData.achievements || '',
      content: logData.content || '',
    }
  }, [logData])

  const handleSubmit = async () => {
    if (!comment.trim()) return

    const normalizedGrade = normalizeScore(grade)
    if (grade !== '' && normalizedGrade === '') {
      setLoadingError('Score must be a number between 1 and 5.')
      return
    }

    setSubmitting(true)
    setLoadingError('')
    try {
      await updateSupervisorLog(id, {
        decision: mapStatusToDecision(status),
        comment: comment.trim(),
        score: normalizedGrade === '' ? null : Number(normalizedGrade),
      })
      setSubmitted(true)
    } catch (err) {
      setLoadingError(err?.message || 'Unable to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-gray-500 text-sm">Loading report details...</p>
      </div>
    )
  }

  if (loadingError && !logData) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-red-500 text-sm mb-4">{loadingError}</p>
        <button onClick={() => navigate('/supervisor')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={38} className="text-primary-600" />
        </div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Feedback Submitted</h2>
        <p className="text-gray-500 text-sm mb-2">
          Your review for <strong>{display.student}</strong>'s report has been recorded.
        </p>
        <p className="text-sm mb-6">
          Status set to: <span className={`font-semibold ${status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span>
          {grade && <> · Grade: <span className="font-semibold text-primary-700">{grade}</span></>}
        </p>
        <button onClick={() => navigate('/supervisor')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] animate-fade-in">
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div>
            <h2 className="font-heading font-bold text-gray-900 text-sm">{display.title}</h2>
            <p className="text-xs text-gray-400">{display.student} · {display.index}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Building2 size={12} /> {display.company}</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {display.submitted ? new Date(display.submitted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </span>
          </div>
          <span className={display.prevStatus === 'Reviewed' ? 'badge-success ml-2' : display.prevStatus === 'Needs Revision' ? 'badge-danger ml-2' : 'badge-warning ml-2'}>
            {display.prevStatus}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="bg-primary-900 text-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">{display.title}</h3>
                  <p className="text-primary-300 text-xs">{display.student} — {display.index}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-primary-400">Company:</span> <span className="text-primary-100">{display.company}</span></div>
                <div><span className="text-primary-400">Period:</span> <span className="text-primary-100">{display.weekLabel}</span></div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  Daily Entries
                </h4>
                {display.entries.length === 0 ? (
                  <p className="text-xs text-gray-500">No daily entries provided.</p>
                ) : (
                  <div className="space-y-4">
                    {display.entries.map((entry, index) => (
                      <div key={`${entry.day || 'Day'}-${index}`} className="rounded-lg border border-gray-100 p-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{entry.day || `Day ${index + 1}`}</p>
                        {entry.tasks ? <p className="text-xs text-gray-600"><span className="font-semibold">Tasks:</span> {entry.tasks}</p> : null}
                        {entry.skills ? <p className="text-xs text-gray-600"><span className="font-semibold">Skills:</span> {entry.skills}</p> : null}
                        {entry.challenges ? <p className="text-xs text-gray-600"><span className="font-semibold">Challenges:</span> {entry.challenges}</p> : null}
                        {entry.solutions ? <p className="text-xs text-gray-600"><span className="font-semibold">Solutions:</span> {entry.solutions}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  Achievements
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{display.achievements || 'No achievements provided.'}</p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  Summary
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{display.content || 'No summary content provided.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 flex-shrink-0 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-primary-50/40">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              <h3 className="font-heading font-semibold text-gray-800">Review & Feedback</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">Your feedback will be shared with the student</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white">
                  {getStudentInitials(display.student)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 font-heading">{display.student}</p>
                  <p className="text-xs text-gray-400 font-mono">{display.index}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1"><Building2 size={11} /> {display.company}</span>
                <span className="flex items-center gap-1"><FileText size={11} /> {display.type}</span>
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-primary-100 flex items-center justify-center">
                  <CheckCircle size={11} className="text-primary-600" />
                </span>
                Review Decision *
              </label>
              <select
                className="form-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="Approved">Approved</option>
                <option value="Needs Revision">Needs Revision</option>
              </select>
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                  <Star size={11} className="text-amber-600" />
                </span>
                Grade / Score
              </label>
              <select
                className="form-input"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              >
                <option value="">No score</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={String(value)}>
                    {`${value} ${value === 1 ? 'Star' : 'Stars'}`}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-1">
                {[...Array(5)].map((_, index) => {
                  const selectedGrade = Number(grade) || 0
                  return (
                    <Star
                      key={index}
                      size={16}
                      className={index < selectedGrade ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                  <MessageSquare size={11} className="text-sky-600" />
                </span>
                Feedback Comments *
              </label>
              <textarea
                className="form-input min-h-[140px] resize-none text-sm"
                placeholder="Provide detailed, constructive feedback to help the student improve."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{comment.length} chars</p>
              {loadingError ? <p className="text-xs text-red-500 mt-2">{loadingError}</p> : null}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Quick Snippets</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Excellent technical depth',
                  'Needs more detail',
                  'Good reflection',
                  'Improve structure',
                  'Well documented',
                ].map((snippet) => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => setComment((current) => (current ? `${current}\n${snippet}` : snippet))}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-primary-50
                               hover:text-primary-700 text-gray-500 transition-colors border border-transparent
                               hover:border-primary-200"
                  >
                    + {snippet}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 space-y-2 bg-gray-50/40 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim()}
              className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <CheckCircle size={16} /> Submit Feedback
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
