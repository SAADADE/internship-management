import { useState } from 'react'
import { CheckCircle, Building2, MapPin, User, Phone, Calendar } from 'lucide-react'

export default function InternshipRegistration() {
  const [form, setForm] = useState({
    companyName: '', location: '', supervisorName: '', supervisorContact: '',
    startDate: '', endDate: '', department: '', description: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.companyName) e.companyName = 'Company name is required'
    if (!form.location) e.location = 'Location is required'
    if (!form.supervisorName) e.supervisorName = 'Supervisor name is required'
    if (!form.startDate) e.startDate = 'Start date is required'
    if (!form.endDate) e.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.startDate >= form.endDate)
      e.endDate = 'End date must be after start date'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) return setErrors(e2)
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-primary-600" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
        <p className="text-gray-500 font-body mb-6">
          Your internship registration has been submitted successfully and is pending approval from your supervisor.
        </p>
        <div className="card p-5 text-left space-y-2 mb-6">
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Company:</span> {form.companyName}</p>
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Location:</span> {form.location}</p>
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Duration:</span> {form.startDate} → {form.endDate}</p>
        </div>
        <button onClick={() => setSubmitted(false)} className="btn-secondary">
          Register Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <p className="text-gray-500 text-sm font-body">Fill in your placement details below. All fields marked * are required.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <Building2 size={15} className="text-primary-700" />
              </div>
              <h3 className="font-heading font-semibold text-gray-800">Company Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company Name *</label>
                <input
                  className={`form-input ${errors.companyName ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="e.g. Ghana Revenue Authority"
                  value={form.companyName}
                  onChange={e => set('companyName', e.target.value)}
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="form-label">Department / Unit</label>
                <input
                  className="form-input"
                  placeholder="e.g. IT Department"
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <MapPin size={15} className="text-sky-700" />
              </div>
              <h3 className="font-heading font-semibold text-gray-800">Location</h3>
            </div>
            <input
              className={`form-input ${errors.location ? 'border-red-300' : ''}`}
              placeholder="e.g. Accra, Greater Accra Region"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>

          {/* Supervisor */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <User size={15} className="text-amber-700" />
              </div>
              <h3 className="font-heading font-semibold text-gray-800">Supervisor Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Supervisor Name *</label>
                <input
                  className={`form-input ${errors.supervisorName ? 'border-red-300' : ''}`}
                  placeholder="e.g. Mr. Kofi Asante"
                  value={form.supervisorName}
                  onChange={e => set('supervisorName', e.target.value)}
                />
                {errors.supervisorName && <p className="text-red-500 text-xs mt-1">{errors.supervisorName}</p>}
              </div>
              <div>
                <label className="form-label">
                  <span className="flex items-center gap-1.5"><Phone size={12} /> Contact / Email</span>
                </label>
                <input
                  className="form-input"
                  placeholder="+233 20 000 0000"
                  value={form.supervisorContact}
                  onChange={e => set('supervisorContact', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar size={15} className="text-purple-700" />
              </div>
              <h3 className="font-heading font-semibold text-gray-800">Internship Period</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className={`form-input ${errors.startDate ? 'border-red-300' : ''}`}
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className={`form-input ${errors.endDate ? 'border-red-300' : ''}`}
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Additional Notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              className="form-input min-h-[90px] resize-none"
              placeholder="Any additional information about your placement..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit Registration'}
            </button>
            <button type="button" className="btn-secondary px-6">Save Draft</button>
          </div>
        </form>
      </div>
    </div>
  )
}
