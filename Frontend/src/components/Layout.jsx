import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useLocation } from 'react-router-dom'

const PAGE_META = {
  '/dashboard':            { title: 'Dashboard', breadcrumb: 'Student Portal / Dashboard' },
  '/internship/register':  { title: 'Internship Registration', breadcrumb: 'Student Portal / Internship' },
  '/reports':              { title: 'My Reports', breadcrumb: 'Student Portal / Reports' },
  '/reports/upload':       { title: 'Upload Report', breadcrumb: 'Student Portal / Reports / Upload' },
  '/supervisor':           { title: 'Supervisor Dashboard', breadcrumb: 'Supervisor Portal / Dashboard' },
  '/admin':                { title: 'Admin Dashboard', breadcrumb: 'Admin Portal / Dashboard' },
  '/profile':              { title: 'My Profile', breadcrumb: 'Account / Profile' },
}

export default function Layout({ children, fullWidth = false }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const meta = PAGE_META[location.pathname] || { title: 'AcademIQ', breadcrumb: '' }

  const sidebarWidth = collapsed ? 'ml-16' : 'ml-60'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarWidth}`}>
        <Navbar pageTitle={meta.title} breadcrumb={meta.breadcrumb} />
        <main className={`flex-1 p-6 animate-fade-in ${fullWidth ? '' : 'max-w-7xl'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
