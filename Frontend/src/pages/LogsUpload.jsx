import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { getStudentProfile } from '../api'
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

function buildInitialErrors() {
  return {
    startDate: '',
    endDate: '',
    achievements: '',
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
    endDate: ''
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

  useEffect(() => {
    const nextValues = buildInitialFormData(resolvedProfile, resolvedInternship, user)
    setFormData((prev) => ({
      ...prev,
      ...nextValues,
    }))
  }, [resolvedProfile, resolvedInternship, user])

  useEffect(() => {
    let isMounted = true

    const syncProfile = async () => {
      if (!user?.role || user.role !== 'student') return

      try {
        const latestProfile = await getStudentProfile()
        if (!isMounted) return

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

        const nextValues = buildInitialFormData(latestProfile, resolvedInternship, { ...user, profile: latestProfile })
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
  }, [user?.role, user?.id, resolvedInternship])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

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

  const handleSubmit = (e) => {
    e.preventDefault()

    const nextErrors = validateForm()
    setErrors(nextErrors)

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      return
    }

    setIsSubmitted(true)
  }

  const handleSubmitAnother = () => {
    setIsSubmitted(false)
    setFormData(buildInitialFormData(resolvedProfile, resolvedInternship, user))
    setErrors(buildInitialErrors())
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
                <input
                  className="form-input bg-gray-50"
                  name={field.name}
                  value={formData[field.name]}
                  readOnly
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Internship Information</h2>
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
              <input className="form-input" />
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
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label className="text-sm text-gray-600">
            I confirm that the information submitted is accurate and represents the activities completed during this internship week.
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSubmit} className="btn-primary">Submit Weekly Log</button>
        </div>
      </div>
    </div>
  )
}
