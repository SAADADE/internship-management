import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useLocation } from 'react-router-dom'

const PAGE_META = {
  '/dashboard':            { title: 'Dashboard' },
  '/internship/register':  { title: 'Internship Registration' },
  '/internship/my-registrations': { title: 'My Internships' },
  '/reports':              { title: 'My Reports' },
  '/reports/logs/:id':     { title: 'Weekly Log Details' },
  '/reports/upload':       { title: 'Upload Report' },
  '/supervisor':           { title: 'Supervisor Dashboard' },
  '/admin':                { title: 'Admin Dashboard' },
  '/admin/companies':      { title: 'Manage Companies' },
  '/profile':              { title: 'My Profile' },
}

function resolvePageMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname]
  if (/^\/reports\/logs\/[^/]+$/.test(pathname)) return PAGE_META['/reports/logs/:id']
  return { title: 'InternDO', breadcrumb: '' }
}

export default function Layout({ children, fullWidth = false }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const meta = resolvePageMeta(location.pathname)

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
