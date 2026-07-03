import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Mock users for demo
const MOCK_USERS = {
  student: { id: 1, name: 'Peter Nyarko', email: 'student@demo.com', role: 'student', avatar: 'PN' },
  supervisor: { id: 2, name: 'Dr. Theresa', email: 'supervisor@demo.com', role: 'supervisor', avatar: 'AO' },
  admin: { id: 3, name: 'Admin User', email: 'admin@demo.com', role: 'admin', avatar: 'AU' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your report has been reviewed', time: '2 min ago', read: false },
    { id: 2, text: 'Submission deadline approaching — 3 days left', time: '1 hr ago', read: false },
    { id: 3, text: 'New feedback received from Dr Theresa', time: '3 hrs ago', read: true },
  ])

  const login = (email, password) => {
    // Demo login: any password works, role determined by email
    if (email.includes('supervisor')) return setUser(MOCK_USERS.supervisor) || true
    if (email.includes('admin')) return setUser(MOCK_USERS.admin) || true
    setUser(MOCK_USERS.student)
    return true
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
