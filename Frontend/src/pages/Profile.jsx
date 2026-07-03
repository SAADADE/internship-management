import { useState } from 'react'
import { User, Mail, Shield, Edit3, Save, X, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || ''
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')

  const handleSave = () => {
    // In a real app, this would update the user data via API
    console.log('Saving profile:', formData)
    setIsEditing(false)
    // For demo, we'll just close edit mode
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || ''
    })
    setIsEditing(false)
  }

  const handlePasswordSubmit = () => {
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

    console.log('Changing password for', user?.email, passwordData)
    setPasswordMessage('Password changed successfully.')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setShowPasswordForm(false)
  }

  const handlePasswordCancel = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordMessage('')
    setShowPasswordForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-700 flex items-center justify-center text-xl font-bold text-white">
            {user?.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">{user?.name}</h1>
            <p className="text-gray-500 capitalize">{user?.role} Account</p>
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
            >
              <Edit3 size={14} className="mr-2" />
              Edit Profile
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
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{user?.name}</p>
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
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{user?.email}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
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
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input-field"
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
          <span className="text-sm text-gray-700">Account is active</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Last login: {new Date().toLocaleDateString('en-GB', {
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