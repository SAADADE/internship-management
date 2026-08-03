import { createContext, useContext, useState } from 'react'
import { loginUser } from '../api'
import { saveProfile } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your report has been reviewed', time: '2 min ago', read: false },
    { id: 2, text: 'Submission deadline approaching — 3 days left', time: '1 hr ago', read: false },
    { id: 3, text: 'New feedback received from Dr Theresa', time: '3 hrs ago', read: true },
  ])

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
      })
    }

    setUser(normalizedUser)
    return normalizedUser
  }

  const logout = () => setUser(null)

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <AuthContext.Provider value={{ user, login, logout, notifications, markAllRead }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
