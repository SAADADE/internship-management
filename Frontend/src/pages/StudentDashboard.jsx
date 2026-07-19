import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import StatsCard from '../components/StatsCard'
import {
  Briefcase, FileText, Clock, MessageSquare,
  Upload, PlusCircle, CheckCircle, AlertCircle,
  ArrowRight, TrendingUp
} from 'lucide-react'

const ACTIVITY = [
  { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Report #3 reviewed by supervisor', time: '2 hours ago' },
  { icon: Upload,      color: 'text-sky-500',     bg: 'bg-sky-50',     label: 'Weekly Log Sheet uploaded', time: 'Yesterday, 4:30 PM' },
  { icon: MessageSquare, color: 'text-primary-500', bg: 'bg-primary-50', label: 'Feedback received on Log sheet - Week 3', time: '2 days ago' },
  { icon: AlertCircle, color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Deadline approaching — Final Report due in 3 days', time: '3 days ago' },
  { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Internship registration successful', time: '1 week ago' },
]

const QUICK_ACTIONS = [
  { icon: PlusCircle, label: 'Register Internship', sub: 'Submit your placement details', to: '/internship/register', color: 'bg-primary-700 hover:bg-primary-800 text-white' },
  { icon: Upload,     label: 'Upload Log Sheet',    sub: 'Attach your weekly logbook', to: '/reports/upload',       color: 'bg-sky-600 hover:bg-sky-700 text-white' },
  { icon: FileText,   label: 'Generate Report',       sub: 'Please ensure you have uploaded all log sheets', to: '/reports/generate',  color: 'bg-amber-500 hover:bg-amber-600 text-white' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  
  return 'Good evening'
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Greeting banner */}
      <div className="card p-6 bg-gradient-to-br from-primary-900 to-primary-700 text-white overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-primary-200 text-sm font-body mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h2 className="font-heading text-2xl font-bold">
            {getGreeting()}, {firstName} 👋
          </h2>
          <p className="text-primary-200 text-sm mt-2 font-body">
            You have <span className="text-white font-semibold">2 pending reports</span> and a deadline in <span className="text-amber-300 font-semibold">3 days</span>.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Briefcase}     label="Internship Status" value="Active"  color="green"  trendLabel="Registered — Semester 2" />
        <StatsCard icon={FileText}      label="Reports Submitted" value="3"       color="blue"   trend={12} trendLabel="vs last semester" />
        <StatsCard icon={Clock}         label="Pending Reviews"   value="2"       color="amber"  trendLabel="Awaiting supervisor" />
        <StatsCard icon={MessageSquare} label="Feedback Received" value="5"       color="purple" trendLabel="3 actionable items" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Activity timeline */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Recent Activity</h3>
            <span className="badge-success"><TrendingUp size={11} /> Up to date</span>
          </div>
          <div className="space-y-1">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="flex gap-4 py-3 group">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <item.icon size={15} className={item.color} />
                  </div>
                  {i < ACTIVITY.length - 1 && <div className="w-px h-full bg-gray-100 mt-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm text-gray-700 font-body leading-snug">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl
                    text-left transition-all duration-200 group ${a.color}`}
                >
                  <a.icon size={22} className="flex-shrink-0" />
                  <div>
                    <p className="font-semibold font-heading text-sm">{a.label}</p>
                    <p className="text-xs opacity-80 font-body mt-0.5">{a.sub}</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="card p-5 border-l-4 border-amber-400">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-amber-500" />
              <h4 className="font-heading font-semibold text-sm text-gray-800">Upcoming Deadlines</h4>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Final Report Submission', due: '3 days', badge: 'badge-warning' },
                { label: 'Log Sheet — Week 10', due: '5 days', badge: 'badge-info' },
                { label: 'Final Report submitted', due: '3 weeks', badge: 'badge-success' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-body">{d.label}</p>
                  <span className={d.badge}>{d.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
