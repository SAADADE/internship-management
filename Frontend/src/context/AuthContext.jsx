import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getNotificationSummary,
  getNotifications,
  loginUser,
  markAllNotificationsRead,
  markNotificationRead as markNotificationReadApi,
} from '../api'
import { saveProfile, getStoredProfile, clearProfile } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null

    try {
      const storedUser = window.localStorage.getItem('academicIQ_user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (user) {
      window.localStorage.setItem('academicIQ_user', JSON.stringify(user))
    } else {
      window.localStorage.removeItem('academicIQ_user')
    }
  }, [user])

  const refreshNotifications = useCallback(async () => {
    if (!user) return []
    const data = await getNotifications()
    const mapped = Array.isArray(data)
      ? data.map((item) => ({
          id: item.id,
          text: item.message || item.title,
          time: item.time,
          read: Boolean(item.read),
          title: item.title,
          type: item.type,
          createdAt: item.created_at,
          metadata: item.metadata || {},
        }))
      : []
    setNotifications(mapped)
    setUnreadCount(mapped.filter((item) => !item.read).length)
    return mapped
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let isMounted = true

    const loadSummary = async () => {
      try {
        const summary = await getNotificationSummary()
        if (!isMounted) return
        setUnreadCount(Number(summary?.unread_count || 0))
      } catch {
        if (isMounted) {
          setUnreadCount((previous) => previous)
        }
      }
    }

    loadSummary()
    const intervalId = window.setInterval(loadSummary, 30000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedProfile = getStoredProfile()
    if (!user && storedProfile) {
      const normalizedUser = {
        id: storedProfile?.id,
        name: `${storedProfile?.firstName || storedProfile?.first_name || ''} ${storedProfile?.lastName || storedProfile?.last_name || ''}`.trim() || storedProfile?.email || 'User',
        email: storedProfile?.email || storedProfile?.sch_email || '',
        role: storedProfile?.role || 'student',
        avatar: (storedProfile?.firstName || storedProfile?.first_name || storedProfile?.email || 'U').slice(0, 2).toUpperCase(),
        profile: storedProfile,
      }
      setUser(normalizedUser)
    }
  }, [user])

  const login = async (username, password) => {
    const data = await loginUser({ username, password })

    const profile = data.profile || {}
    const normalizedUser = {
      id: data.user?.id,
      name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || data.user?.username,
      email: data.user?.email,
      role: data.role,
      avatar: (data.user?.first_name || data.user?.username || 'U').slice(0, 2).toUpperCase(),
      profile,
    }

    if (data.role === 'student') {
      saveProfile({
        ...profile,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        studentId: profile?.index_number || '',
        department: profile?.department || '',
        program: profile?.programme || '',
        level: profile?.level || '',
        institution: profile?.institution_name || '',
        role: data.role,
      })
    }

    setUser(normalizedUser)
    return normalizedUser
  }

  const logout = () => {
    setUser(null)
    clearProfile()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('academicIQ_user')
    }
  }

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead()
    } finally {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }, [])

  const markNotificationRead = useCallback(async (notificationId) => {
    if (!notificationId) return
    try {
      await markNotificationReadApi(notificationId)
    } finally {
      setNotifications((prev) => prev.map((item) => (
        item.id === notificationId ? { ...item, read: true } : item
      )))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        notifications,
        unreadCount,
        refreshNotifications,
        markAllRead,
        markNotificationRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
