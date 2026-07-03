import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Save,
  Calendar, Building2, FileText, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, MessageSquare, Star
} from 'lucide-react'

const MOCK_REPORT = {
  id: 1,
  student: 'Peter Nyarko',
  index: 'CS/0241/19',
  company: 'Ghana Revenue Authority',
  submitted: '2024-03-11',
  title: 'IT Training Report — Week 4',
  type: 'Weekly Log Sheet',
  prevStatus: 'Pending',
}

// Simulated PDF content renderer
function PDFViewer({ title }) {
  const [page, setPage] = useState(1)
  const totalPages = 4
  const [zoom, setZoom] = useState(100)

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* PDF toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center
                       disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-500 font-body min-w-[70px] text-center">
            Page <strong>{page}</strong> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center
                       disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(60, z - 10))}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-xs font-mono text-gray-500 min-w-[40px] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(150, z + 10))}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Simulated PDF page */}
      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div
          className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-200"
          style={{ width: `${zoom * 5.6}px`, maxWidth: '100%' }}
        >
          {/* PDF Header */}
          <div className="bg-primary-900 text-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base">{title}</h3>
                <p className="text-primary-300 text-xs">{MOCK_REPORT.student} — {MOCK_REPORT.index}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-primary-400">Company:</span> <span className="text-primary-100">{MOCK_REPORT.company}</span></div>
              <div><span className="text-primary-400">Period:</span> <span className="text-primary-100">Week 4, Feb 2024</span></div>
            </div>
          </div>

          {/* PDF Body */}
          <div className="p-6 space-y-5">
            {page === 1 && (
              <>
                <div>
                  <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                    1. Activities Undertaken This Week
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600 font-body leading-relaxed">
                    <p>Monday: Attended orientation session with the IT infrastructure team. Was assigned to shadow the senior network administrator and assist with routine server monitoring tasks. Observed configuration of VPN tunnels across regional offices.</p>
                    <p>Tuesday: Participated in a cybersecurity awareness training workshop organized by the IT Security unit. Learned about phishing prevention and multi-factor authentication policies currently deployed across the organization.</p>
                    <p>Wednesday: Assisted in the deployment of a new patch update across 40 workstations in the main office. Used Microsoft SCCM to push updates remotely. Documented the process in the IT helpdesk ticketing system.</p>
                    <p>Thursday: Worked alongside the database team to run routine integrity checks on the Oracle database server. Generated weekly performance reports using SQL queries provided by the DBA supervisor.</p>
                    <p>Friday: Attended a project brief meeting for the upcoming digital transformation initiative. Took detailed meeting notes and drafted a summary report for the IT Director's review.</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                    2. Skills & Knowledge Gained
                  </h4>
                  <ul className="text-xs text-gray-600 font-body space-y-1 list-disc ml-4 leading-relaxed">
                    <li>Hands-on exposure to enterprise networking (Cisco infrastructure)</li>
                    <li>Practical experience with SCCM patch deployment workflows</li>
                    <li>Database monitoring and Oracle SQL query execution</li>
                    <li>Technical report writing in a professional corporate setting</li>
                    <li>Introduction to ITIL-based helpdesk ticket management</li>
                  </ul>
                </div>
              </>
            )}
            {page === 2 && (
              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  3. Challenges Encountered
                </h4>
                <div className="space-y-2 text-xs text-gray-600 font-body leading-relaxed">
                  <p>The primary challenge this week was adapting to the complex enterprise network topology, which differs significantly from the lab environments encountered during academic training. The scale of the infrastructure and the number of interdependent systems required careful observation before attempting any hands-on tasks.</p>
                  <p>A secondary challenge was communicating technical findings to non-technical staff members during the cybersecurity training session, which helped develop communication skills beyond purely technical proficiency.</p>
                </div>
              </div>
            )}
            {page === 3 && (
              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  4. Learning Outcomes & Reflection
                </h4>
                <p className="text-xs text-gray-600 font-body leading-relaxed">
                  This week significantly deepened my understanding of enterprise IT operations. The theoretical knowledge acquired during academic studies, while foundational, requires substantial practical context to be truly applicable. The exposure to real-world tools such as SCCM, Oracle DBA consoles, and Cisco network management platforms has been invaluable. I intend to pursue further self-study in Oracle database administration to strengthen my contributions in upcoming weeks.
                </p>
              </div>
            )}
            {page === 4 && (
              <div>
                <h4 className="font-heading font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-2">
                  5. Plan for Next Week
                </h4>
                <ul className="text-xs text-gray-600 font-body space-y-1 list-disc ml-4 leading-relaxed">
                  <li>Assist with the Active Directory user provisioning project</li>
                  <li>Complete self-study on Oracle SQL Advanced Queries</li>
                  <li>Participate in the weekly IT team retrospective meeting</li>
                  <li>Begin drafting the mid-term progress report</li>
                </ul>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Student Signature: ___________________</p>
                  <p className="text-xs text-gray-400 mt-1">Date: {MOCK_REPORT.submitted}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [grade, setGrade] = useState('')
  const [status, setStatus] = useState('Approved')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!comment.trim()) return alert('Please add feedback before submitting.')
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1100))
    setSubmitting(false)
    setSubmitted(true)
  }

  const handleSaveDraft = async () => {
    setSaved(true)
    await new Promise(r => setTimeout(r, 800))
    setSaved(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={38} className="text-primary-600" />
        </div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Feedback Submitted ✅</h2>
        <p className="text-gray-500 text-sm mb-2">
          Your review for <strong>{MOCK_REPORT.student}</strong>'s report has been recorded.
        </p>
        <p className="text-sm mb-6">
          Status set to: <span className={`font-semibold ${status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span>
          {grade && <> · Grade: <span className="font-semibold text-primary-700">{grade}</span></>}
        </p>
        <button onClick={() => navigate('/supervisor')} className="btn-primary">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] animate-fade-in">

      {/* Top bar */}
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
            <h2 className="font-heading font-bold text-gray-900 text-sm">{MOCK_REPORT.title}</h2>
            <p className="text-xs text-gray-400">{MOCK_REPORT.student} · {MOCK_REPORT.index}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Building2 size={12} /> {MOCK_REPORT.company}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(MOCK_REPORT.submitted).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>
          </div>
          <span className="badge-warning ml-2">Pending Review</span>
        </div>
      </div>

      {/* Split screen */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Document viewer */}
        <div className="flex-1 overflow-hidden border-r border-gray-200">
          <PDFViewer title={MOCK_REPORT.title} />
        </div>

        {/* RIGHT — Feedback panel */}
        <div className="w-96 flex-shrink-0 bg-white flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-primary-50/40">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              <h3 className="font-heading font-semibold text-gray-800">Review & Feedback</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">Your feedback will be shared with the student</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Student info card */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white">
                  PM
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 font-heading">{MOCK_REPORT.student}</p>
                  <p className="text-xs text-gray-400 font-mono">{MOCK_REPORT.index}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1"><Building2 size={11} /> {MOCK_REPORT.company}</span>
                <span className="flex items-center gap-1"><FileText size={11} /> {MOCK_REPORT.type}</span>
              </div>
            </div>

            {/* Status */}
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
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Approved">✅ Approved</option>
                <option value="Needs Revision">🔄 Needs Revision</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Grade */}
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
                onChange={e => setGrade(e.target.value)}
              >
                <option value="">Select grade...</option>
                <option value="A+">A+ (Exceptional)</option>
                <option value="A">A (Excellent)</option>
                <option value="B+">B+ (Very Good)</option>
                <option value="B">B (Good)</option>
                <option value="C+">C+ (Above Average)</option>
                <option value="C">C (Average)</option>
                <option value="D">D (Below Average)</option>
                <option value="F">F (Fail)</option>
              </select>
            </div>

            {/* Feedback comment */}
            <div>
              <label className="form-label flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                  <MessageSquare size={11} className="text-sky-600" />
                </span>
                Feedback Comments *
              </label>
              <textarea
                className="form-input min-h-[140px] resize-none text-sm"
                placeholder="Provide detailed, constructive feedback to help the student improve...

e.g. The report demonstrates a good understanding of the week's activities. However, Section 3 (Challenges) would benefit from more specific technical details..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{comment.length} chars</p>
            </div>

            {/* Quick feedback snippets */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Quick Snippets</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Excellent technical depth',
                  'Needs more detail',
                  'Good reflection',
                  'Improve structure',
                  'Well documented',
                ].map(snippet => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => setComment(c => c ? `${c}\n${snippet}` : snippet)}
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

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2 bg-gray-50/40 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-3"
            >
              {submitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <CheckCircle size={16} /> Submit Feedback
                </span>
              )}
            </button>
            <button
              onClick={handleSaveDraft}
              className="btn-secondary w-full py-2.5"
            >
              {saved ? (
                <span className="flex items-center gap-2 justify-center text-emerald-600">
                  <CheckCircle size={14} /> Draft Saved!
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
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
