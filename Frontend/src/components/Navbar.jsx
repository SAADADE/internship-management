import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function formatRelativeTime(isoTime) {
  if (!isoTime) return 'Just now'
  const then = new Date(isoTime).getTime()
  if (Number.isNaN(then)) return 'Just now'

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Navbar({ pageTitle, breadcrumb }) {
  const {
    user,
    notifications,
    unreadCount,
    refreshNotifications,
    markAllRead,
    markNotificationRead,
    logout,
  } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifsRef = useRef(null)
  const profileRef = useRef(null)

  const unread = unreadCount

  const getNotificationTarget = (notification) => {
    const type = notification?.type
    const metadata = notification?.metadata || {}
    const role = user?.role

    if (type === 'weekly_log_submitted') {
      return metadata.log_id ? `/supervisor/review/${metadata.log_id}` : '/supervisor/reports'
    }
    if (type === 'log_reviewed' || type === 'logs_bulk_reviewed') {
      return '/feedback'
    }
    if (type === 'report_submitted') {
      if (role === 'admin') return '/admin/reports'
      if (role === 'supervisor') return '/supervisor/reports'
      return '/reports'
    }
    if (type === 'appraisal_submitted') {
      return role === 'admin' ? '/admin/reports' : '/feedback'
    }
    if (type === 'company_request_submitted') {
      return '/admin/companies'
    }
    if (type === 'company_request_reviewed') {
      return '/internship/company-request'
    }
    if (type === 'internship_registered') {
      return role === 'admin' ? '/admin/students' : '/supervisor'
    }

    if (role === 'admin') return '/admin'
    if (role === 'supervisor') return '/supervisor'
    return '/dashboard'
  }

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    if (!notification.read) {
      await markNotificationRead(notification.id)
    }

    setShowNotifs(false)
    navigate(getNotificationTarget(notification))
  }

  useEffect(() => {
    if (!showNotifs) return
    refreshNotifications()
  }, [showNotifs, refreshNotifications])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between
                       px-6 sticky top-0 z-30 shadow-sm">
      {/* Left: Title + Breadcrumb */}
      <div>
        {breadcrumb && (
          <p className="text-xs text-gray-400 font-body mb-0.5">{breadcrumb}</p>
        )}
        <h1 className="text-base font-bold text-gray-900 font-heading leading-tight">{pageTitle}</h1>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }}
            className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-primary-50
                       flex items-center justify-center transition-colors group"
          >
            <Bell size={18} className="text-gray-500 group-hover:text-primary-700 transition-colors" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full
                               bg-red-500 animate-pulse-dot border border-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl
                            border border-gray-100 overflow-hidden animate-slide-up z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <span className="font-heading font-semibold text-sm text-gray-800">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500 font-body text-center">
                    No notifications yet.
                  </div>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors
                      ${!n.read ? 'bg-primary-50/40' : ''} w-full text-left`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                      ${!n.read ? 'bg-primary-500' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-sm text-gray-700 font-body">{n.title || n.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.time)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
                       hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center
                            text-xs font-bold text-white">
              {user?.avatar}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 font-heading leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400 font-body capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl
                            border border-gray-100 overflow-hidden animate-slide-up z-50 py-1">
              <button
                onClick={() => { navigate('/profile'); setShowProfile(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-body"
              >
                <User size={15} /> Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
