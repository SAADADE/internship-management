import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ pageTitle, breadcrumb }) {
  const { user, notifications, markAllRead, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifsRef = useRef(null)
  const profileRef = useRef(null)

  const unread = notifications.filter(n => !n.read).length

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
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors
                      ${!n.read ? 'bg-primary-50/40' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                      ${!n.read ? 'bg-primary-500' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-sm text-gray-700 font-body">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
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
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600
                                  hover:bg-gray-50 transition-colors font-body"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowProfile(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-body"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
