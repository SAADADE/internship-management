import { useEffect, useState } from 'react'
import StatsCard from '../components/StatsCard'
import {
  Users, FileText, Briefcase,
  Activity, UserCheck,
  RefreshCw, CheckCircle
} from 'lucide-react'
import { getAdminDashboard } from '../api'


export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [dashboard, setDashboard] = useState({ stats: {}, activity: [], recent_registrations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setError('')
    try {
      const payload = await getAdminDashboard()
      setDashboard(payload || { stats: {}, activity: [], recent_registrations: [] })
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboard()
  }

  const activityIcon = (type) => {
    if (type === 'appraisal') return UserCheck
    if (type === 'report') return FileText
    if (type === 'internship') return Briefcase
    return CheckCircle
  }

  const activityColor = (type) => {
    if (type === 'appraisal') return 'bg-emerald-100 text-emerald-700'
    if (type === 'report') return 'bg-sky-100 text-sky-700'
    if (type === 'internship') return 'bg-amber-100 text-amber-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="card p-5 bg-gradient-to-br from-primary-900 to-primary-700 text-white flex-1 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-primary-300 text-sm mb-1">System Overview</p>
              <h2 className="font-heading text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-primary-200 text-sm mt-1">
                All systems operational ·
                Last updated: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20
                         rounded-xl text-white text-sm font-medium transition-colors border border-white/20"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard icon={Users} label="Total Students" value={dashboard.stats?.total_students ?? 0} color="green" trendLabel="Registered" />
        <StatsCard icon={FileText} label="Total Reports" value={dashboard.stats?.total_reports ?? 0} color="blue" trendLabel="Submitted" />
        <StatsCard icon={Briefcase} label="Active Internships" value={dashboard.stats?.active_internships ?? 0} color="amber" trendLabel="Currently ongoing" />
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activity log */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary-600" />
              <h3 className="section-title">System Activity</h3>
            </div>
            <span className="badge-success">Live</span>
          </div>
          <div className="space-y-1">
            {dashboard.activity.map((log, i) => {
              const Icon = activityIcon(log.type)
              return (
                <div key={log.id || i} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${activityColor(log.type)}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 font-body">{log.action}</p>
                    <p className="text-xs text-gray-400 truncate">{log.detail}</p>
                  </div>
                  <span className="text-xs text-gray-300 whitespace-nowrap ml-auto pt-0.5">
                    {new Date(log.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
            {!loading && dashboard.activity.length === 0 && <p className="text-sm text-gray-500">No recent activity yet.</p>}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-primary-600" />
              <h3 className="section-title">Recent Registrations</h3>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50/70">
              <tr>
                {['Student', 'Company', 'Date'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dashboard.recent_registrations.map((r, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${i % 2 ? 'bg-gray-50/30' : ''}`}>
                  <td className="table-cell">
                    <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.index}</p>
                  </td>
                  <td className="table-cell text-sm text-gray-500">{r.company}</td>
                  <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}
                  </td>
                </tr>
              ))}
              {!loading && dashboard.recent_registrations.length === 0 && (
                <tr>
                  <td className="table-cell text-sm text-gray-500" colSpan={3}>No registrations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
