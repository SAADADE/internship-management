import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  'Track internship registrations in real-time',
  'Submit and manage academic reports digitally',
  'Receive supervisor feedback instantly',
  'Monitor deadlines and submission status',
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Please enter your email and password.')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900)) // simulate API call
    login(email, password)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex font-body">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full
                          bg-primary-800/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full
                          bg-primary-700/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[500px] h-[500px] rounded-full border border-primary-800/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[350px] h-[350px] rounded-full border border-primary-700/20" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <span className="font-heading font-bold text-white text-xl">AcademicIQ</span>
            <p className="text-xs text-primary-400">Management Portal</p>
          </div>
        </div>

        {/* Center content */}
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
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-primary-200 text-sm">
                <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Demo hint */}
        <div className="relative bg-primary-900/60 border border-primary-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary-300 mb-2 uppercase tracking-wider">Demo Credentials</p>
          <div className="space-y-1 text-xs text-primary-400 font-mono">
            <p><span className="text-primary-200">Student:</span> student@demo.com / any</p>
            <p><span className="text-primary-200">Supervisor:</span> supervisor@demo.com / any</p>
            <p><span className="text-primary-200">Admin:</span> admin@demo.com / any</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-gray-50">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-gray-900">AcademIQ</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h1 className="font-heading text-2xl font-bold text-gray-900">Welcome</h1>
              <p className="text-gray-500 text-sm mt-1.5">Sign in to access your portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@university.edu.gh"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input pr-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary-600"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary-700 hover:text-primary-900
                                                  font-medium transition-colors">
                  Forgot Password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100
                                rounded-xl text-red-600 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don’t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-primary-700 hover:text-primary-900 transition-colors"
            >
              Sign up
            </button>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} AcademIQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
