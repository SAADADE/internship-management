import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { createStudentLog, getStudentInternships, getStudentProfile, updateStudentProfile } from '../api'
import { useAuth } from '../context/AuthContext'
import { getStoredInternship, getStoredProfile, saveProfile } from '../utils/storage'

const studentFields = [
  { label: 'Student Name', name: 'studentName' },
  { label: 'Student ID', name: 'studentId' },
  { label: 'Department', name: 'department' },
  { label: 'Programme', name: 'programme' },
  { label: 'Level', name: 'level' },
  { label: 'Institution', name: 'institution' }
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const levels = ['100', '200', '300', '400']

function buildInitialErrors() {
  return {
    startDate: '',
    endDate: '',
    achievements: '',
    level: '',
    confirmation: '',
    ...Object.fromEntries(days.flatMap((day) => {
      const key = day.toLowerCase()
      return [[`${key}Tasks`, ''], [`${key}Skills`, '']]
    }))
  }
}

function buildInitialFormData(profile = {}, internship = {}, user = null) {
  const firstName = profile?.first_name || profile?.firstName || user?.profile?.first_name || user?.first_name || ''
  const lastName = profile?.last_name || profile?.lastName || user?.profile?.last_name || user?.last_name || ''

  return {
    studentName: [firstName, lastName].filter(Boolean).join(' ').trim() || user?.name || '',
    studentId: profile?.index_number || profile?.studentId || profile?.indexNumber || '',
    department: profile?.department || '',
    programme: profile?.programme || profile?.program || '',
    level: profile?.level || '',
    institution: profile?.institution_name || profile?.institution || '',
    weekNumber: '',
    internshipId: internship?.internship_id || internship?.id || '',
    mondayTasks: '',
    mondaySkills: '',
    mondayChallenges: '',
    mondaySolutions: '',
    tuesdayTasks: '',
    tuesdaySkills: '',
    tuesdayChallenges: '',
    tuesdaySolutions: '',
    wednesdayTasks: '',
    wednesdaySkills: '',
    wednesdayChallenges: '',
    wednesdaySolutions: '',
    thursdayTasks: '',
    thursdaySkills: '',
    thursdayChallenges: '',
    thursdaySolutions: '',
    fridayTasks: '',
    fridaySkills: '',
    fridayChallenges: '',
    fridaySolutions: '',
    achievements: '',
    companyName: internship?.company_name || '',
    departmentUnit: internship?.internship_position || '',
    supervisorName: internship?.internship_supervisor || '',
    startDate: '',
    endDate: '',
    confirmation: false,
  }
}

export default function ReportUpload() {
  const { user } = useAuth()
  const storedProfile = useMemo(() => getStoredProfile() || {}, [])
  const storedInternship = useMemo(() => getStoredInternship() || {}, [])
  const resolvedProfile = user?.profile || storedProfile || {}
  const resolvedInternship = storedInternship || {}

  const initialFormData = useMemo(
    () => buildInitialFormData(resolvedProfile, resolvedInternship, user),
    [resolvedProfile, resolvedInternship, user]
  )

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState(buildInitialErrors)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSavingLevel, setIsSavingLevel] = useState(false)
  const [levelMessage, setLevelMessage] = useState('')
  const [internships, setInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const selectedInternship = internships.find((entry) => entry.internship_id === selectedInternshipId) || internships[0] || storedInternship || {}
  const activeInternship = selectedInternship || resolvedInternship || {}

  useEffect(() => {
    const nextValues = buildInitialFormData(resolvedProfile, activeInternship, user)
    setFormData((prev) => ({
      ...prev,
      ...nextValues,
    }))
  }, [resolvedProfile, activeInternship, user])

  useEffect(() => {
    let isMounted = true

    const syncProfile = async () => {
      if (!user?.role || user.role !== 'student') return

      try {
        const [latestProfile, latestInternships] = await Promise.all([
          getStudentProfile(),
          getStudentInternships(),
        ])
        if (!isMounted) return

        const normalizedInternships = Array.isArray(latestInternships)
          ? latestInternships
          : latestInternships
            ? [latestInternships]
            : []

        saveProfile({
          ...latestProfile,
          firstName: latestProfile?.first_name || '',
          lastName: latestProfile?.last_name || '',
          studentId: latestProfile?.index_number || '',
          department: latestProfile?.department || '',
          program: latestProfile?.programme || '',
          level: latestProfile?.level || '',
          institution: latestProfile?.institution_name || '',
        })

        setInternships(normalizedInternships)
        const fallbackInternship = normalizedInternships[0] || storedInternship || {}
        setSelectedInternshipId((current) => current && normalizedInternships.some((entry) => entry.internship_id === current)
          ? current
          : fallbackInternship?.internship_id || '')

        const nextValues = buildInitialFormData(latestProfile, fallbackInternship, { ...user, profile: latestProfile })
        setFormData((prev) => ({
          ...prev,
          ...nextValues,
        }))
      } catch {
        // Ignore profile refresh errors and fall back to locally stored data.
      }
    }

    syncProfile()

    return () => {
      isMounted = false
    }
  }, [user?.role, user?.id, storedInternship])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    setFormData((prev) => ({ ...prev, [name]: fieldValue }))

    if (name === 'confirmation') {
      setErrors((prev) => ({ ...prev, confirmation: fieldValue ? '' : 'Please confirm the information is accurate before submitting.' }))
      return
    }

    if (name === 'achievements') {
      setErrors((prev) => ({ ...prev, achievements: value.trim() ? '' : 'Please add at least one key achievement.' }))
      return
    }

    if (name.endsWith('Tasks') || name.endsWith('Skills')) {
      setErrors((prev) => ({ ...prev, [name]: value.trim() ? '' : `Please enter ${name.endsWith('Tasks') ? 'the tasks performed' : 'the skills learned'}.` }))
    }
  }

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleLevelChange = async (e) => {
    const { value } = e.target
    setFormData((prev) => ({ ...prev, level: value }))
    setErrors((prev) => ({ ...prev, level: value ? '' : 'Please select your level.' }))
    setLevelMessage('')
    setIsSavingLevel(true)

    try {
      const updatedProfile = await updateStudentProfile({ level: value })
      saveProfile({
        ...storedProfile,
        ...updatedProfile,
        level: updatedProfile?.level || value,
      })
    } catch {
      setLevelMessage('Unable to save your level. Please try again.')
    } finally {
      setIsSavingLevel(false)
    }
  }

  const handleInternshipSwitch = (internship) => {
    const nextId = internship?.internship_id || ''
    setSelectedInternshipId(nextId)
    setFormData((prev) => ({
      ...prev,
      ...buildInitialFormData(resolvedProfile, internship, user),
    }))
    setErrors(buildInitialErrors())
    setSubmitError('')
  }

  const validateForm = () => {
    const nextErrors = buildInitialErrors()

    if (!formData.startDate.trim()) {
      nextErrors.startDate = 'Please select a start date.'
    }

    if (!formData.endDate.trim()) {
      nextErrors.endDate = 'Please select an end date.'
    }

    if (!formData.achievements.trim()) {
      nextErrors.achievements = 'Please add at least one key achievement.'
    }

    if (!formData.level) {
      nextErrors.level = 'Please select your level.'
    }

    if (!formData.confirmation) {
      nextErrors.confirmation = 'Please confirm the information is accurate before submitting.'
    }

    days.forEach((day) => {
      const taskKey = `${day.toLowerCase()}Tasks`
      const skillKey = `${day.toLowerCase()}Skills`

      if (!formData[taskKey].trim()) {
        nextErrors[taskKey] = 'Please enter the tasks performed.'
      }

      if (!formData[skillKey].trim()) {
        nextErrors[skillKey] = 'Please enter the skills learned.'
      }
    })

    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextErrors = validateForm()
    setErrors(nextErrors)

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        studentName: formData.studentName,
        studentId: formData.studentId,
        department: formData.department,
        programme: formData.programme,
        level: formData.level,
        institution: formData.institution,
        companyName: formData.companyName,
        departmentUnit: formData.departmentUnit,
        supervisorName: formData.supervisorName,
        weekNumber: formData.weekNumber,
        startDate: formData.startDate,
        endDate: formData.endDate,
        achievements: formData.achievements,
        mondayTasks: formData.mondayTasks,
        mondaySkills: formData.mondaySkills,
        mondayChallenges: formData.mondayChallenges,
        mondaySolutions: formData.mondaySolutions,
        tuesdayTasks: formData.tuesdayTasks,
        tuesdaySkills: formData.tuesdaySkills,
        tuesdayChallenges: formData.tuesdayChallenges,
        tuesdaySolutions: formData.tuesdaySolutions,
        wednesdayTasks: formData.wednesdayTasks,
        wednesdaySkills: formData.wednesdaySkills,
        wednesdayChallenges: formData.wednesdayChallenges,
        wednesdaySolutions: formData.wednesdaySolutions,
        thursdayTasks: formData.thursdayTasks,
        thursdaySkills: formData.thursdaySkills,
        thursdayChallenges: formData.thursdayChallenges,
        thursdaySolutions: formData.thursdaySolutions,
        fridayTasks: formData.fridayTasks,
        fridaySkills: formData.fridaySkills,
        fridayChallenges: formData.fridayChallenges,
        fridaySolutions: formData.fridaySolutions,
        confirmation: formData.confirmation,
        internshipId: formData.internshipId || selectedInternship?.internship_id || '',
      }

      await createStudentLog(payload)
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(error.message || 'Unable to submit your weekly log right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAnother = () => {
    setIsSubmitted(false)
    setFormData(buildInitialFormData(resolvedProfile, activeInternship, user))
    setErrors(buildInitialErrors())
    setSubmitError('')
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-gray-900">Weekly log submitted successfully</h2>
            <p className="text-sm text-gray-600">Your internship weekly log has been recorded and is ready for review.</p>
          </div>
          <button type="button" onClick={handleSubmitAnother} className="btn-primary">
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="card p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Weekly Internship Log Sheet</h1>
          <p className="text-sm text-gray-500">Record your weekly internship activities and reflections.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Student Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {studentFields.map((field) => (
              <div key={field.name}>
                <label className="form-label">{field.label}</label>
                {field.name === 'level' ? (
                  <>
                    <select
                      className="form-input"
                      name="level"
                      value={formData.level}
                      onChange={handleLevelChange}
                      disabled={isSavingLevel}
                    >
                      <option value="">Select level</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    {isSavingLevel && <p className="mt-1 text-xs text-gray-500">Saving level...</p>}
                    {levelMessage && <p className="mt-1 text-xs text-red-500">{levelMessage}</p>}
                    {errors.level && <p className="mt-1 text-xs text-red-500">{errors.level}</p>}
                  </>
                ) : (
                  <input
                    className="form-input bg-gray-50"
                    name={field.name}
                    value={formData[field.name]}
                    readOnly
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Internship Information</h2>
            {internships.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {internships.map((internship) => {
                  const isActive = selectedInternshipId === internship.internship_id
                  return (
                    <button
                      key={internship.internship_id}
                      type="button"
                      onClick={() => handleInternshipSwitch(internship)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {internship.company_name || 'Internship'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input bg-gray-50" name="companyName" value={formData.companyName} readOnly />
            </div>
            <div>
              <label className="form-label">Department/Unit</label>
              <input className="form-input bg-gray-50" name="departmentUnit" value={formData.departmentUnit} readOnly />
            </div>
            <div>
              <label className="form-label">Industry Supervisor</label>
              <input className="form-input bg-gray-50" name="supervisorName" value={formData.supervisorName} readOnly />
            </div>
            <div>
              <label className="form-label">Week Number</label>
              <input
                className="form-input"
                name="weekNumber"
                value={formData.weekNumber}
                onChange={handleChange}
                placeholder="e.g. 3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    className={`form-input pr-10 appearance-none ${errors.startDate ? 'border-red-300' : ''}`}
                    value={formData.startDate}
                    onChange={(e) => setField('startDate', e.target.value)}
                  />
                </div>
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    className={`form-input pr-10 appearance-none ${errors.endDate ? 'border-red-300' : ''}`}
                    value={formData.endDate}
                    onChange={(e) => setField('endDate', e.target.value)}
                  />
                  
                
                </div>
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Key Achievements</h2>
          <div>
            <label className="form-label">What did you achieve this week? *</label>
            <textarea
              className="form-input min-h-[100px] resize-none"
              name="achievements"
              value={formData.achievements}
              onChange={handleChange}
              placeholder="List key achievements, tasks completed, or results delivered."
            />
            {errors.achievements && <p className="text-red-500 text-xs mt-1">{errors.achievements}</p>}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Daily Activities</h2>

          {days.map((day) => {
            const taskKey = `${day.toLowerCase()}Tasks`
            const skillKey = `${day.toLowerCase()}Skills`
            const challengeKey = `${day.toLowerCase()}Challenges`
            const solutionKey = `${day.toLowerCase()}Solutions`

            return (
              <div key={day} className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-700">{day}</h3>

                <div>
                  <label className="form-label">Tasks Performed</label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={taskKey}
                    value={formData[taskKey]}
                    onChange={handleChange}
                    placeholder={`Describe the tasks completed on ${day.toLowerCase()}.`}
                    required
                  />
                  {errors[taskKey] && <p className="text-red-500 text-xs mt-1">{errors[taskKey]}</p>}
                </div>

                <div>
                  <label className="form-label">Skills Learned</label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={skillKey}
                    value={formData[skillKey]}
                    onChange={handleChange}
                    placeholder={`Mention the skills gained on ${day.toLowerCase()}.`}
                    required
                  />
                  {errors[skillKey] && <p className="text-red-500 text-xs mt-1">{errors[skillKey]}</p>}
                </div>

                <div>
                  <label className="form-label">Challenges Encountered <span className="text-gray-400">(Optional)</span></label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={challengeKey}
                    value={formData[challengeKey]}
                    onChange={handleChange}
                    placeholder={`Note any challenges faced on ${day.toLowerCase()}.`}
                  />
                </div>

                <div>
                  <label className="form-label">Solutions Applied <span className="text-gray-400">(Optional)</span></label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={solutionKey}
                    value={formData[solutionKey]}
                    onChange={handleChange}
                    placeholder={`Describe how those challenges were addressed.`}
                  />
                </div>
              </div>
            )
          })}
        </section>

        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <input
            id="log-confirmation"
            name="confirmation"
            type="checkbox"
            checked={formData.confirmation}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="log-confirmation" className="text-sm text-gray-600">
            I confirm that the information submitted is accurate and represents the activities completed during this internship week.
          </label>
        </div>
        {errors.confirmation && <p className="text-red-500 text-xs -mt-5">{errors.confirmation}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.confirmation || isSubmitting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Weekly Log'}
          </button>
        </div>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        {isSubmitted && (
          <p className="text-sm text-emerald-600">Your weekly log was submitted successfully.</p>
        )}
      </div>
    </div>
  )
}
