import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  'Track internship registrations in real-time',
  'Submit and manage academic reports digitally',
  'Receive supervisor feedback instantly',
  'Monitor deadlines and submission status',
]

const LEVELS = ['100', '200', '300', '400']

const initialFormState = {
  firstName: '',
  lastName: '',
  studentId: '',
  email: '',
  phone: '',
  faculty: '',
  department: '',
  program: '',
  level: '100',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  remember: false,
  terms: false,
  showPassword: false,
}

const emptyErrors = {
  firstName: '',
  lastName: '',
  studentId: '',
  email: '',
  phone: '',
  faculty: '',
  department: '',
  program: '',
  username: '',
  password: '',
  confirmPassword: '',
  terms: '',
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validatePhone(value) {
  return /^\+?[0-9]{7,15}$/.test(value)
}

function validateField(name, value, compareValue = '') {
  const trimmed = typeof value === 'string' ? value.trim() : value
  switch (name) {
    case 'firstName':
    case 'lastName':
    case 'faculty':
    case 'department':
    case 'program':
    case 'username':
      return trimmed ? '' : 'This field is required.'
    case 'studentId':
      return trimmed ? '' : 'Student ID is required.'
    case 'email':
      if (!trimmed) return 'Email address is required.'
      return validateEmail(trimmed) ? '' : 'Enter a valid email address.'
    case 'phone':
      if (!trimmed) return 'Phone number is required.'
      return validatePhone(trimmed) ? '' : 'Enter a valid phone number.'
    case 'password':
      if (!trimmed) return 'Password is required.'
      if (trimmed.length < 8) return 'Use at least 8 characters.'
      return ''
    case 'confirmPassword':
      if (!trimmed) return 'Please confirm your password.'
      if (trimmed !== compareValue) return 'Passwords do not match.'
      return ''
    case 'terms':
      return value ? '' : 'You must accept the terms and conditions.'
    default:
      return ''
  }
}

function getPasswordStrength(password) {
  if (!password) return { label: 'Empty', score: 0, color: 'bg-red-500' }
  const strong = /(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)
  const medium = /(?=.*[A-Z])(?=.*[0-9])/.test(password)
  if (strong) return { label: 'Strong', score: 100, color: 'bg-emerald-500' }
  if (medium) return { label: 'Medium', score: 66, color: 'bg-amber-400' }
  return { label: 'Weak', score: 33, color: 'bg-red-500' }
}

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState(emptyErrors)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const passwordStrength = getPasswordStrength(formData.password)

  const handleFieldChange = (event) => {
    const { name, type, value, checked } = event.target
    const fieldValue = type === 'checkbox' ? checked : value
    setFormData((current) => ({ ...current, [name]: fieldValue }))

    setErrors((current) => ({
      ...current,
      [name]: validateField(name, fieldValue, name === 'confirmPassword' ? current.password : current.password),
    }))

    if (name === 'password' && current.formData?.confirmPassword) {
      setErrors((current) => ({
        ...current,
        confirmPassword: validateField('confirmPassword', current.formData.confirmPassword, fieldValue),
      }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const fieldErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      studentId: validateField('studentId', formData.studentId),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      faculty: validateField('faculty', formData.faculty),
      department: validateField('department', formData.department),
      program: validateField('program', formData.program),
      username: validateField('username', formData.username),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData.password),
      terms: validateField('terms', formData.terms),
    }

    setErrors(fieldErrors)
    setSuccess('')

    const hasError = Object.values(fieldErrors).some(Boolean)
    if (hasError) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setLoading(false)
    setSuccess('Your account was created successfully. You can now sign in.')
    setFormData(initialFormState)
    setErrors(emptyErrors)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F9FAFB] text-slate-900 font-body">
      <aside className="hidden lg:flex lg:w-1/2 min-h-screen bg-primary-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-800/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary-700/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-primary-800/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-primary-700/20" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <span className="font-heading font-bold text-white text-xl">AcademicIQ</span>
            <p className="text-xs text-primary-400">Management Portal</p>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-center py-12">
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-4">
            Streamlining Internship &<br />
            <span className="text-primary-400">Academic Report</span> Management
          </h2>
          <p className="text-primary-300 text-base mb-10 leading-relaxed">
            A unified platform for students, supervisors, and administrators to manage
            the complete internship lifecycle.
          </p>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-primary-200 text-sm">
                <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative bg-primary-900/60 border border-primary-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary-300 mb-2 uppercase tracking-wider">Student success</p>
          <p className="text-sm text-primary-200 leading-relaxed">
            Join thousands of learners and mentors who keep internship workflows organized,
            productive, and easy to manage.
          </p>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">AcademicIQ</p>
                <h1 className="text-xl font-heading font-bold text-slate-900">Create an account</h1>
              </div>
            </div>
          </div>

          <div className="card p-8 sm:p-10 shadow-card-hover">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Welcome aboard</p>
              <h1 className="mt-3 text-3xl font-heading font-bold text-slate-900 sm:text-4xl">
                Create your AcademicIQ account.
              </h1>
            </div>

            {success && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 mb-6 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, firstName: validateField('firstName', e.target.value) }))}
                    className="form-input"
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, lastName: validateField('lastName', e.target.value) }))}
                    className="form-input"
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="studentId" className="form-label">Student ID</label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, studentId: validateField('studentId', e.target.value) }))}
                    className="form-input"
                    placeholder="2024-12345"
                  />
                  {errors.studentId && <p className="mt-2 text-sm text-red-600">{errors.studentId}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, email: validateField('email', e.target.value) }))}
                    className="form-input"
                    placeholder="you@university.edu.gh"
                    autoComplete="email"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, phone: validateField('phone', e.target.value) }))}
                    className="form-input"
                    placeholder="+233 24 123 4567"
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="role" className="form-label">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFieldChange}
                    className="form-input"
                  >
                    <option value="student">Student</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="faculty" className="form-label">Faculty</label>
                  <input
                    id="faculty"
                    name="faculty"
                    type="text"
                    value={formData.faculty}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, faculty: validateField('faculty', e.target.value) }))}
                    className="form-input"
                    placeholder="College of Engineering"
                  />
                  {errors.faculty && <p className="mt-2 text-sm text-red-600">{errors.faculty}</p>}
                </div>

                <div>
                  <label htmlFor="department" className="form-label">Department</label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, department: validateField('department', e.target.value) }))}
                    className="form-input"
                    placeholder="Computer Engineering"
                  />
                  {errors.department && <p className="mt-2 text-sm text-red-600">{errors.department}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="program" className="form-label">Program of Study</label>
                  <input
                    id="program"
                    name="program"
                    type="text"
                    value={formData.program}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, program: validateField('program', e.target.value) }))}
                    className="form-input"
                    placeholder="BSc Computer Engineering"
                  />
                  {errors.program && <p className="mt-2 text-sm text-red-600">{errors.program}</p>}
                </div>

                <div>
                  <label htmlFor="level" className="form-label">Level</label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleFieldChange}
                    className="form-input"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, username: validateField('username', e.target.value) }))}
                    className="form-input"
                    placeholder="academy_user"
                    autoComplete="username"
                  />
                  {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div className="relative">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    name="password"
                    type={formData.showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, password: validateField('password', e.target.value) }))}
                    className="form-input pr-11"
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, showPassword: !current.showPassword }))}
                    className="absolute right-3 top-1/2 h-10 -translate-y-1/2 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    aria-label={formData.showPassword ? 'Hide password' : 'Show password'}
                  >
                    {formData.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={formData.showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleFieldChange}
                    onBlur={(e) => setErrors((current) => ({ ...current, confirmPassword: validateField('confirmPassword', e.target.value, formData.password) }))}
                    className="form-input pr-11"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, showPassword: !current.showPassword }))}
                    className="absolute right-3 top-1/2 h-10 -translate-y-1/2 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    aria-label={formData.showPassword ? 'Hide password' : 'Show password'}
                  >
                    {formData.showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-700">Password strength</p>
                    <span className="text-sm font-semibold text-slate-700">{passwordStrength.label}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`${passwordStrength.color} h-full`} style={{ width: `${passwordStrength.score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Use 8+ characters with uppercase letters, numbers, and symbols for stronger security.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer transition hover:border-primary-300">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleFieldChange}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer transition hover:border-primary-300">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleFieldChange}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  <div className="text-sm text-slate-600">
                    I accept the <span className="font-semibold text-primary-700">terms and conditions</span>
                  </div>
                </label>
              </div>
              {errors.terms && <p className="mt-[-0.75rem] text-sm text-red-600">{errors.terms}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Already have an account?</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-700 hover:text-primary-900 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
