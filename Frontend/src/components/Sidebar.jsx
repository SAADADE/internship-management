import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare,
  Settings, LogOut, GraduationCap, ChevronRight
} from 'lucide-react'

const studentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Internship', icon: Briefcase, to: '/internship/register' },
  { label: 'Weekly Logs', icon: FileText, to: '/reports' },
  { label: 'Upload Logs', icon: FileText, to: '/reports/upload' },
  { label: 'Feedback', icon: MessageSquare, to: '/feedback' },
]

const supervisorNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/supervisor' },
  { label: 'Reports', icon: FileText, to: '/supervisor/reports' },
  { label: 'Appraisal', icon: FileText, to: '/supervisor/appraisal' },
]

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Students', icon: GraduationCap, to: '/admin/students' },
  { label: 'Weekly Logs', icon: FileText, to: '/admin/reports' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'supervisor' ? supervisorNav :
    user?.role === 'admin' ? adminNav : studentNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-primary-950 text-white
        flex flex-col z-40 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-primary-800/60
        ${collapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-heading font-bold text-white text-base tracking-tight">AcademIQ</span>
            <p className="text-[10px] text-primary-300 font-body leading-tight">Management Portal</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-widest">
            {user?.role === 'student' ? '— Student Portal' :
             user?.role === 'supervisor' ? '— Supervisor Portal' : '— Admin Portal'}
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                   text-white bg-primary-700/80 transition-all duration-150
                   ${collapsed ? 'justify-center' : ''}`
                : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                   text-primary-300 hover:text-white hover:bg-primary-800/60
                   transition-all duration-150
                   ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="font-body">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-primary-800/60 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center
                            text-xs font-bold text-white flex-shrink-0">
              {user?.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate font-heading">{user?.name}</p>
              <p className="text-[11px] text-primary-400 truncate font-body">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-primary-300 hover:text-red-400 hover:bg-red-950/30
            transition-all duration-150
            ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="font-body">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-7 w-6 h-6 bg-primary-700 border border-primary-600
                   rounded-full flex items-center justify-center
                   hover:bg-primary-600 transition-colors shadow-md z-50"
      >
        <ChevronRight
          size={12}
          className={`text-white transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
    </aside>
  )
}
