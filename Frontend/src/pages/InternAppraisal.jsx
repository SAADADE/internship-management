import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Save } from 'lucide-react'

const criteria = [
  { key: 'punctuality', label: '1. Punctuality at Work' },
  { key: 'attitude', label: '2. Ability on the Job / Attitude to Work' },
  { key: 'superiors', label: '3. Relationship with Superiors' },
  { key: 'colleagues', label: '4. Relationship with Colleagues' },
  { key: 'cooperation', label: '5. Cooperation' },
  { key: 'safety', label: '6. Safety Consciousness' },
  { key: 'resourcefulness', label: '7. Resourcefulness' },
  { key: 'initiative', label: '8. Initiative' },
  { key: 'leadership', label: '9. Leadership Drive' }
]

const students = [
  { id: 1, name: 'Peter Nyarko', index: 'CS/0241/19', department: 'Computer Science', status: 'Pending Appraisal' },
  { id: 2, name: 'Mawuli Boateng', index: 'IT/0112/20', department: 'Information Technology', status: 'Pending Appraisal' },
  { id: 3, name: 'Grace Adjei', index: 'CS/0187/20', department: 'Computer Science', status: 'Appraised' }
]

const ratingOptions = [
  { value: '5', label: 'Excellent (5)' },
  { value: '4', label: 'Very Good (4)' },
  { value: '3', label: 'Good (3)' },
  { value: '2', label: 'Fair (2)' },
  { value: '1', label: 'Poor (1)' }
]

export default function InternAppraisal() {
  const navigate = useNavigate()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [scores, setScores] = useState({})
  const [generalComments, setGeneralComments] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [position, setPosition] = useState('')
  const [signature, setSignature] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext('2d')
      if (!context) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 2
      context.strokeStyle = '#111827'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startDrawing = (event) => {
    const point = getCanvasPoint(event)
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!point || !context) return

    isDrawingRef.current = true
    context.beginPath()
    context.moveTo(point.x, point.y)
    canvas?.setPointerCapture?.(event.pointerId)
  }

  const draw = (event) => {
    if (!isDrawingRef.current) return

    const point = getCanvasPoint(event)
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!point || !context) return

    context.lineTo(point.x, point.y)
    context.stroke()
  }

  const stopDrawing = (event) => {
    if (!isDrawingRef.current) return

    isDrawingRef.current = false
    const canvas = canvasRef.current
    canvas?.releasePointerCapture?.(event.pointerId)
    setSignature(canvas?.toDataURL() || '')
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))

    canvas.width = width * dpr
    canvas.height = height * dpr
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2
    context.strokeStyle = '#111827'
    setSignature('')
  }

  const handleScoreChange = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    const missing = criteria.some((item) => !scores[item.key])
    if (missing) return alert('Please complete all evaluation criteria before submitting.')
    if (!generalComments.trim()) return alert('Please add general comments before submitting.')
    if (!signature) return alert('Please sign in the designated area before submitting.')

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSubmitting(false)
    setSubmitted(true)
  }

  const handleSaveDraft = async () => {
    setSaved(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaved(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={38} className="text-primary-600" />
        </div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Final Appraisal Submitted ✅</h2>
        <p className="text-gray-500 text-sm mb-6">
          The supervisor appraisal has been recorded successfully.
        </p>
        <button onClick={() => navigate('/supervisor')} className="btn-primary">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/supervisor')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Intern Appraisal</h1>
          <p className="text-sm text-gray-500">Select a student to begin the evaluation.</p>
        </div>
      </div>

      <div className="card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Students</h2>
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p className="font-semibold text-gray-800">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.index} • {student.department}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${student.status === 'Appraised' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {student.status}
                  </span>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="btn-secondary px-4 py-2"
                  >
                    Appraise
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedStudent && (
          <div className="space-y-8 border-t border-gray-200 pt-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Appraisal Form</h2>
                  <p className="text-sm text-gray-500">Evaluating {selectedStudent.name}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-sm text-primary-600 hover:text-primary-700">
                  Change Student
                </button>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                <p><span className="font-semibold">Student:</span> {selectedStudent.name}</p>
                <p><span className="font-semibold">Index:</span> {selectedStudent.index}</p>
                <p><span className="font-semibold">Department:</span> {selectedStudent.department}</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-700">Evaluation Criteria for the Supervisor</h3>
              {criteria.map((criterion) => (
                <div key={criterion.key} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">{criterion.label}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {ratingOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${scores[criterion.key] === option.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'}`}
                      >
                        <input
                          type="radio"
                          name={criterion.key}
                          value={option.value}
                          checked={scores[criterion.key] === option.value}
                          onChange={() => handleScoreChange(criterion.key, option.value)}
                          className="h-3.5 w-3.5 accent-primary-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">General Comments</h2>
              <textarea
                className="form-input min-h-[140px] resize-none"
                placeholder="Provide an overall assessment of the student’s performance, strengths, areas for improvement, and recommendations."
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Supervisor Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Supervisor’s Name</label>
                  <input
                    className="form-input"
                    placeholder="Enter your full name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Position</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Supervisor / Manager"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Signature</label>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <canvas
                      ref={canvasRef}
                      className="h-40 w-full rounded-lg border border-dashed border-gray-300 bg-white"
                      style={{ touchAction: 'none' }}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerLeave={stopDrawing}
                      onPointerCancel={stopDrawing}
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <p>Use your mouse to sign in the box.</p>
                      <button type="button" onClick={clearSignature} className="text-primary-600 hover:text-primary-700">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleSaveDraft} className="btn-secondary">
                {saved ? (
                  <span className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={14} /> Draft Saved!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={14} /> Save Draft
                  </span>
                )}
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span>Submit Final Appraisal</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
