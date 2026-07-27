import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Save, Calendar, Building2, FileText,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquare, Star
} from 'lucide-react'

const REPORT_DATA = [
  {
    id: 1,
    studentName: 'Peter Mensah',
    studentId: 'CS/0420/20',
    department: 'Computer Science',
    company: 'Tech Innovation Ltd',
    title: 'Final Internship Report',
    submittedOn: '2024-03-15',
    type: 'Final Report',
    summary: 'The student completed a full internship cycle with strong technical delivery and clear reflection on workplace learning.',
    sections: [
      'Abstract: This report documents the student’s contribution to software testing and support during the internship placement.',
      'Introduction: The internship was undertaken at Tech Innovation Ltd, where the student worked with the operations and IT support teams.',
      'Conclusion: The student demonstrated professionalism, adaptability, and a strengthened understanding of real-world workplace systems.'
    ]
  },
  {
    id: 2,
    studentName: 'Ama Johnson',
    studentId: 'ENG/0422/20',
    department: 'Engineering',
    company: 'Cloud Services Ltd',
    title: 'Final Internship Report',
    submittedOn: '2024-03-14',
    type: 'Final Report',
    summary: 'The student worked on process improvement initiatives and presented a strong understanding of engineering practices.',
    sections: [
      'Abstract: The report reflects the student’s involvement in a structural engineering support project during the internship.',
      'Introduction: The placement at Cloud Services Ltd provided practical exposure to engineering documentation and operations.',
      'Conclusion: The internship helped the student connect academic learning with professional engineering expectations.'
    ]
  },
  {
    id: 3,
    studentName: 'Yaa Asantewaa',
    studentId: 'BUS/0423/20',
    department: 'Business',
    company: 'Enterprise Solutions',
    title: 'Final Internship Report',
    submittedOn: '2024-03-12',
    type: 'Final Report',
    summary: 'The student contributed to business process documentation and gained useful exposure to stakeholder communication.',
    sections: [
      'Abstract: This report highlights the student’s work in a business operations setting and their role in supporting internal reporting.',
      'Introduction: The internship at Enterprise Solutions introduced the student to business analysis and project coordination.',
      'Conclusion: The experience built confidence in communication, planning, and professional teamwork.'
    ]
  }
]

function ReportPreview({ report }) {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const totalPages = 3

  return (
    <div className="flex h-full flex-col bg-gray-100">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[70px] text-center text-xs text-gray-500">
            Page <strong>{page}</strong> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(60, z - 10))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200">
            <ZoomOut size={13} />
          </button>
          <span className="min-w-[40px] text-center font-mono text-xs text-gray-500">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200">
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-auto p-6">
        <div className="overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-200" style={{ width: `${zoom * 5.6}px`, maxWidth: '100%' }}>
          <div className="bg-primary-900 p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold">{report.title}</h3>
                <p className="text-xs text-primary-300">{report.studentName} — {report.studentId}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-primary-400">Company:</span> <span className="text-primary-100">{report.company}</span></div>
              <div><span className="text-primary-400">Submitted:</span> <span className="text-primary-100">{new Date(report.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            {page === 1 && (
              <>
                <div>
                  <h4 className="mb-2 border-b border-gray-100 pb-2 font-heading text-sm font-bold text-gray-800">1. Summary</h4>
                  <p className="text-xs leading-relaxed text-gray-600">{report.summary}</p>
                </div>
                <div>
                  <h4 className="mb-2 border-b border-gray-100 pb-2 font-heading text-sm font-bold text-gray-800">2. Key Highlights</h4>
                  <ul className="ml-4 list-disc space-y-1 text-xs leading-relaxed text-gray-600">
                    <li>Strong contribution to workplace tasks</li>
                    <li>Demonstrated professional growth</li>
                    <li>Clear reflection on learning outcomes</li>
                  </ul>
                </div>
              </>
            )}
            {page === 2 && (
              <div>
                <h4 className="mb-2 border-b border-gray-100 pb-2 font-heading text-sm font-bold text-gray-800">3. Report Details</h4>
                <div className="space-y-2 text-xs leading-relaxed text-gray-600">
                  {report.sections.map((section, index) => (
                    <p key={index}>{section}</p>
                  ))}
                </div>
              </div>
            )}
            {page === 3 && (
              <div>
                <h4 className="mb-2 border-b border-gray-100 pb-2 font-heading text-sm font-bold text-gray-800">4. Closing Reflection</h4>
                <p className="text-xs leading-relaxed text-gray-600">
                  The internship experience strengthened the student’s professional readiness and provided meaningful exposure to real-world responsibilities. The report reflects both practical learning and thoughtful self-evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminReportView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [comment, setComment] = useState('')
  const [grade, setGrade] = useState('')
  const [status, setStatus] = useState('Approved')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const report = REPORT_DATA.find((item) => item.id === Number(id))

  const handleSubmit = async () => {
    if (!comment.trim()) return alert('Please add feedback before submitting.')
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1100))
    setSubmitting(false)
    setSubmitted(true)
  }

  const handleSaveDraft = async () => {
    setSaved(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaved(false)
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Report not found</h1>
        <p className="mt-2 text-sm text-gray-500">The requested report could not be found.</p>
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
          {grade && <> · Grade: <span className="font-semibold text-primary-700">{grade}</span></>}
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
          <span className="badge-warning ml-2">Pending Review</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden border-r border-gray-200">
          <ReportPreview report={report} />
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
              <label className="form-label flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100">
                  <Star size={11} className="text-amber-600" />
                </span>
                Grade / Score
              </label>
              <select className="form-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
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
