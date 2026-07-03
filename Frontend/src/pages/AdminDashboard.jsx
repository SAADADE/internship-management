import { useState } from 'react'
import StatsCard from '../components/StatsCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Users, FileText, Briefcase, TrendingUp,
  Activity, UserCheck, AlertCircle, Clock,
  RefreshCw, Download, Shield, CheckCircle
} from 'lucide-react'

const WEEKLY_DATA = [
  { week: 'Wk 1', submissions: 8,  reviews: 5 },
  { week: 'Wk 2', submissions: 14, reviews: 11 },
  { week: 'Wk 3', submissions: 10, reviews: 9 },
  { week: 'Wk 4', submissions: 18, reviews: 14 },
  { week: 'Wk 5', submissions: 22, reviews: 20 },
  { week: 'Wk 6', submissions: 16, reviews: 15 },
  { week: 'Wk 7', submissions: 24, reviews: 18 },
  { week: 'Wk 8', submissions: 19, reviews: 19 },
]

const STATUS_PIE = [
  { name: 'Reviewed',       value: 67, color: '#059669' },
  { name: 'Pending',        value: 21, color: '#f59e0b' },
  { name: 'Needs Revision', value: 8,  color: '#ef4444' },
  { name: 'Rejected',       value: 4,  color: '#6b7280' },
]

const ACTIVITY_LOG = [
  { icon: UserCheck, color: 'bg-primary-100 text-primary-700', action: 'New student registered', detail: 'Yaa Asantewaa — CS/0421/20', time: '5 min ago' },
  { icon: FileText,  color: 'bg-sky-100 text-sky-700',         action: 'Report submitted',        detail: 'IT Training Report — Peter Mensah', time: '22 min ago' },
  { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', action: 'Report reviewed',       detail: 'Dr. Owusu reviewed Report #4 (Kwame Ofori)', time: '1 hr ago' },
  { icon: AlertCircle, color: 'bg-amber-100 text-amber-700',   action: 'Deadline reminder sent',  detail: 'Report #5 deadline in 3 days — 24 students', time: '2 hrs ago' },
  { icon: Shield,    color: 'bg-violet-100 text-violet-700',    action: 'Admin login',             detail: 'Admin User logged in from 196.x.x.x', time: '3 hrs ago' },
  { icon: Briefcase, color: 'bg-rose-100 text-rose-700',        action: 'Internship approved',    detail: 'Efua Mensah — Tullow Oil Ghana', time: '4 hrs ago' },
]

const RECENT_REGISTRATIONS = [
  { name: 'Yaa Asantewaa',   index: 'CS/0421/20', company: 'Bank of Ghana',       date: '2024-03-11', status: 'Pending' },
  { name: 'Nana Ama Osei',   index: 'CS/0399/20', company: 'Stanbic Bank',        date: '2024-03-10', status: 'Approved' },
  { name: 'Kwabena Frimpong',index: 'CS/0411/20', company: 'Ghana Water Company', date: '2024-03-09', status: 'Approved' },
  { name: 'Akosua Dankwa',   index: 'CS/0403/20', company: 'Electricity Company', date: '2024-03-08', status: 'Pending' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="font-heading font-semibold text-gray-800 text-xs mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.name} className="text-xs font-body" style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}


export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 1000))
    setRefreshing(false)
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users}      label="Total Students"     value="247"  color="green"  trend={5}  trendLabel="vs last semester" />
        <StatsCard icon={FileText}   label="Total Reports"      value="1,024" color="blue"  trend={12} trendLabel="this semester" />
        <StatsCard icon={Briefcase}  label="Active Internships" value="198"  color="amber"  trendLabel="Currently ongoing" />
        <StatsCard icon={TrendingUp} label="Review Rate"        value="94%"  color="purple" trend={3}  trendLabel="above target" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="section-title">Submissions per Week</h3>
              <p className="text-xs text-gray-400 font-body mt-0.5">Reports submitted vs reviewed — Current semester</p>
            </div>
            <button className="btn-secondary text-xs py-1.5 px-3">
              <Download size={13} /> Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={WEEKLY_DATA} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="submissions" name="Submitted" fill="#059669" radius={[5, 5, 0, 0]} />
              <Bar dataKey="reviews"     name="Reviewed"  fill="#a7f3d0" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-primary-500" /> Submitted
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-primary-200" /> Reviewed
            </span>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="section-title">Report Status</h3>
            <p className="text-xs text-gray-400 font-body mt-0.5">Distribution across all submissions</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={STATUS_PIE}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {STATUS_PIE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {STATUS_PIE.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs text-gray-600 font-body">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-700 font-heading">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            {ACTIVITY_LOG.map((log, i) => (
              <div key={i} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${log.color}`}>
                  <log.icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 font-body">{log.action}</p>
                  <p className="text-xs text-gray-400 truncate">{log.detail}</p>
                </div>
                <span className="text-xs text-gray-300 whitespace-nowrap ml-auto pt-0.5">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-primary-600" />
              <h3 className="section-title">Recent Registrations</h3>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-800 font-medium">View all</button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50/70">
              <tr>
                {['Student', 'Company', 'Date', 'Status'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_REGISTRATIONS.map((r, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${i % 2 ? 'bg-gray-50/30' : ''}`}>
                  <td className="table-cell">
                    <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.index}</p>
                  </td>
                  <td className="table-cell text-sm text-gray-500">{r.company}</td>
                  <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}
                  </td>
                  <td className="table-cell">
                    <span className={r.status === 'Approved' ? 'badge-success' : 'badge-warning'}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
