import { useEffect, useState } from 'react'
import { User, Mail, Shield, Edit3, Save, X, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword, getCurrentUserProfile, updateStudentProfile } from '../api'

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profileData, setProfileData] = useState(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    department: user?.profile?.department || '',
    programme: user?.profile?.programme || '',
    level: user?.profile?.level || '',
    institution_name: user?.profile?.institution_name || '',
    phone_number: user?.profile?.phone_number || '',
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')

  const canEditProfile = (profileData?.role || user?.role) === 'student'

  const populateForm = (profile) => {
    const role = profile?.role || ''
    const isSupervisor = role === 'supervisor'
    setFormData({
      name: isSupervisor ? (profile?.fullname || profile?.name || '') : (profile?.name || ''),
      email: isSupervisor ? (profile?.supervisor_email || profile?.email || '') : (profile?.email || ''),
      role: profile?.role || '',
      department: profile?.department || '',
      programme: profile?.programme || '',
      level: profile?.level || '',
      institution_name: profile?.institution_name || '',
      phone_number: profile?.phone_number || '',
    })
  }

  const loadProfile = async () => {
    setLoading(true)
    setProfileError('')
    try {
      const data = await getCurrentUserProfile()
      setProfileData(data)
      populateForm(data)
    } catch (err) {
      setProfileError(err.message || 'Unable to fetch profile information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!canEditProfile) {
      setIsEditing(false)
      return
    }

    try {
      await updateStudentProfile({
        sch_email: formData.email,
        first_name: formData.name.split(' ')[0] || '',
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        department: formData.department,
        programme: formData.programme,
        level: formData.level,
        institution_name: formData.institution_name,
        phone_number: formData.phone_number,
      })
      await loadProfile()
      setIsEditing(false)
    } catch (err) {
      setPasswordMessage(err.message || 'Unable to save profile.')
    }
  }

  const handleCancel = () => {
    populateForm(profileData || user || {})
    setIsEditing(false)
  }

  const handlePasswordSubmit = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage('Please fill in all password fields.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match.')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters.')
      return
    }

    try {
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      })
      setPasswordMessage('Password changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordMessage(err.message || 'Unable to change password.')
    }
  }

  const handlePasswordCancel = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordMessage('')
    setShowPasswordForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {profileError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {profileError}
        </div>
      )}

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-700 flex items-center justify-center text-xl font-bold text-white">
            {user?.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">{formData.name || user?.name}</h1>
            <p className="text-gray-500 capitalize">{(profileData?.role || user?.role)} Account</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 font-heading">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-sm"
              disabled={!canEditProfile || loading}
            >
              <Edit3 size={14} className="mr-2" />
              {canEditProfile ? 'Edit Profile' : 'View Only'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn-primary text-sm"
              >
                <Save size={14} className="mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary text-sm"
              >
                <X size={14} className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing && canEditProfile ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{formData.name || user?.name || '-'}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Mail size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              {isEditing && canEditProfile ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{formData.email || user?.email || '-'}</p>
              )}
            </div>
          </div>

          {/* Additional profile fields */}
          {isEditing && canEditProfile ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                <input value={formData.programme} onChange={(e) => setFormData(prev => ({ ...prev, programme: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <input value={formData.level} onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input value={formData.institution_name} onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input value={formData.phone_number} onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))} className="input-field" />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-600">
              <div><span className="font-semibold text-gray-700">Department:</span> {formData.department || '—'}</div>
              <div><span className="font-semibold text-gray-700">Programme:</span> {formData.programme || '—'}</div>
              <div><span className="font-semibold text-gray-700">Level:</span> {formData.level || '—'}</div>
              <div><span className="font-semibold text-gray-700">Institution:</span> {formData.institution_name || '—'}</div>
              <div><span className="font-semibold text-gray-700">Phone Number:</span> {formData.phone_number || '—'}</div>
            </div>
          )}

          {/* Role */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900 capitalize">{profileData?.role || user?.role}</p>
              <p className="text-xs text-gray-500 mt-1">
                Role cannot be changed from this page. Contact administrator if needed.
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                setShowPasswordForm(prev => !prev)
                setPasswordMessage('')
              }}
              className="btn-secondary text-sm inline-flex items-center"
            >
              <Lock size={14} className="mr-2" />
              {showPasswordForm ? 'Hide Change Password' : 'Change Password'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Change Password</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {passwordMessage && (
                <p className="text-sm text-rose-600">{passwordMessage}</p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handlePasswordCancel}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="btn-primary text-sm"
                >
                  Save Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Status */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-heading mb-4">Account Status</h2>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-700">{loading ? 'Loading account status...' : 'Account is active'}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Last login: {new Date(profileData?.last_login || Date.now()).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

    </div>
  )
}
