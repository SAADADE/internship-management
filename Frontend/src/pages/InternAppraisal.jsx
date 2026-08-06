import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Save, Trash2 } from 'lucide-react'
import {
  createSupervisorAppraisal,
  deleteSupervisorAppraisal,
  getSupervisorAppraisalStudents,
  updateSupervisorAppraisal,
} from '../api'
import { getStoredProfile } from '../utils/storage'

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

const ratingOptions = [
  { value: '5', label: 'Excellent (5)' },
  { value: '4', label: 'Very Good (4)' },
  { value: '3', label: 'Good (3)' },
  { value: '2', label: 'Fair (2)' },
  { value: '1', label: 'Poor (1)' }
]

export default function InternAppraisal() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [profile, setProfile] = useState(getStoredProfile())
  const [scores, setScores] = useState({})
  const [generalComments, setGeneralComments] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [position, setPosition] = useState('')
  const [signature, setSignature] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState('')
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)

  const getDefaultSupervisorName = (storedProfile) => (
    storedProfile?.fullname
    || `${storedProfile?.firstName || storedProfile?.first_name || ''} ${storedProfile?.lastName || storedProfile?.last_name || ''}`.trim()
    || 'Supervisor'
  )

  const getDefaultPosition = (storedProfile) => storedProfile?.supervisorRole || storedProfile?.position || 'Supervisor'

  const clearCanvas = () => {
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
  }

  const applyStudentToForm = (student, fallbackProfile = profile) => {
    setSelectedStudent(student)

    const appraisal = student?.appraisal
    const fallbackDate = new Date().toISOString().slice(0, 10)

    setScores(appraisal?.scores || {})
    setGeneralComments(appraisal?.generalComments || '')
    setSupervisorName(appraisal?.supervisorName || getDefaultSupervisorName(fallbackProfile))
    setPosition(appraisal?.position || getDefaultPosition(fallbackProfile))
    setSignature(appraisal?.signature || '')
    setDate(appraisal?.date || fallbackDate)
  }

  const resetForm = (fallbackProfile = profile) => {
    setSelectedStudent(null)
    setScores({})
    setGeneralComments('')
    setSupervisorName(getDefaultSupervisorName(fallbackProfile))
    setPosition(getDefaultPosition(fallbackProfile))
    setSignature('')
    setDate(new Date().toISOString().slice(0, 10))
    clearCanvas()
  }

  const loadStudents = async (studentToKeepSelectedId = null) => {
    setLoading(true)
    setError('')

    try {
      const data = await getSupervisorAppraisalStudents()
      setStudents(data)

      const nextSelectedStudent = studentToKeepSelectedId
        ? data.find((student) => student.id === studentToKeepSelectedId)
        : null

      if (nextSelectedStudent) {
        applyStudentToForm(nextSelectedStudent)
      } else if (studentToKeepSelectedId) {
        resetForm()
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load assigned students.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedProfile = getStoredProfile()
    if (storedProfile) {
      setProfile(storedProfile)
      setSupervisorName(getDefaultSupervisorName(storedProfile))
      setPosition(getDefaultPosition(storedProfile))
    }
    setDate(new Date().toISOString().slice(0, 10))

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

    loadStudents()

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    clearCanvas()

    if (!signature) return

    const image = new window.Image()
    image.onload = () => {
      const rect = canvas.getBoundingClientRect()
      context.drawImage(image, 0, 0, rect.width, rect.height)
    }
    image.src = signature
  }, [signature])

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
    clearCanvas()
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
    if (!selectedStudent) return alert('Please choose a student to appraise.')

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        student_id: selectedStudent.id,
        scores,
        generalComments: generalComments.trim(),
        supervisorName: supervisorName.trim() || getDefaultSupervisorName(profile),
        position: position.trim() || getDefaultPosition(profile),
        signature,
        date,
      }

      const existingAppraisalId = selectedStudent.appraisal?.id
      const savedAppraisal = existingAppraisalId
        ? await updateSupervisorAppraisal(existingAppraisalId, payload)
        : await createSupervisorAppraisal(payload)

      setSubmittedMessage(existingAppraisalId ? 'The supervisor appraisal has been updated successfully.' : 'The supervisor appraisal has been recorded successfully.')
      setSubmitted(true)
      await loadStudents(selectedStudent.id)
      setSelectedStudent((previous) => (previous ? { ...previous, appraisal: savedAppraisal, status: 'Appraised' } : previous))
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit the appraisal.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaved(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaved(false)
  }

  const handleDelete = async () => {
    const appraisalId = selectedStudent?.appraisal?.id
    if (!appraisalId) return

    const confirmed = window.confirm(`Delete the appraisal for ${selectedStudent.name}?`)
    if (!confirmed) return

    setDeleting(true)
    setError('')

    try {
      await deleteSupervisorAppraisal(appraisalId)
      setSubmitted(false)
      setSubmittedMessage('')
      await loadStudents(selectedStudent.id)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the appraisal.')
    } finally {
      setDeleting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={38} className="text-primary-600" />
        </div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Final Appraisal Submitted ✅</h2>
        <p className="text-gray-500 text-sm mb-6">
          {submittedMessage || 'The supervisor appraisal has been recorded successfully.'}
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
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              Loading assigned students...
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No students are currently assigned to you for appraisal.
            </div>
          ) : (
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
                    onClick={() => applyStudentToForm(student)}
                    className="btn-secondary px-4 py-2"
                  >
                    {student.appraisal ? 'Edit' : 'Appraise'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        {selectedStudent && (
          <div className="space-y-8 border-t border-gray-200 pt-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Appraisal Form</h2>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.appraisal ? `Editing appraisal for ${selectedStudent.name}` : `Evaluating ${selectedStudent.name}`}
                  </p>
                </div>
                <button onClick={() => resetForm()} className="text-sm text-primary-600 hover:text-primary-700">
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
              {selectedStudent.appraisal && (
                <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <Trash2 size={14} />
                  {deleting ? 'Deleting…' : 'Delete Appraisal'}
                </button>
              )}
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span>{selectedStudent.appraisal ? 'Update Appraisal' : 'Submit Final Appraisal'}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
