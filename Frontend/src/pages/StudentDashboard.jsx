import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import StatsCard from '../components/StatsCard'
import { getStudentDashboardSummary } from '../api'
import {
  Briefcase, FileText, Clock, MessageSquare,
  Upload, PlusCircle, CheckCircle, AlertCircle,
  ArrowRight, TrendingUp
} from 'lucide-react'

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
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadSummary = async () => {
      try {
        const data = await getStudentDashboardSummary()
        if (isMounted) {
          setSummary(data)
        }
      } catch (error) {
        console.error('Unable to load dashboard summary', error)
        if (isMounted) {
          setSummary({ stats: {}, activity: [], deadlines: [] })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSummary()
    return () => { isMounted = false }
  }, [])

  const stats = useMemo(() => [
    {
      icon: Briefcase,
      label: 'Internship Status',
      value: summary?.stats?.internship_status || 'Not Registered',
      color: 'green',
    },
    {
      icon: FileText,
      label: 'Reports Submitted',
      value: summary?.stats?.reports_submitted?.toString() || '0',
      color: 'blue',
    },
    {
      icon: Clock,
      label: 'Pending Reviews',
      value: summary?.stats?.pending_reviews?.toString() || '0',
      color: 'amber',
    },
    {
      icon: MessageSquare,
      label: 'Feedback Received',
      value: summary?.stats?.feedback_received?.toString() || '0',
      color: 'purple',
    },
  ], [summary])

  const activity = useMemo(() => {
    if (!summary?.activity?.length) {
      return [{ icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'No recent activity yet', time: 'Start by adding a log or internship entry' }]
    }

    return summary.activity.map(item => ({
      icon: item.icon === 'alert' ? AlertCircle : item.icon === 'upload' ? Upload : CheckCircle,
      color: item.icon === 'alert' ? 'text-amber-500' : item.icon === 'upload' ? 'text-sky-500' : 'text-emerald-500',
      bg: item.icon === 'alert' ? 'bg-amber-50' : item.icon === 'upload' ? 'bg-sky-50' : 'bg-emerald-50',
      label: item.label,
      time: item.time,
    }))
  }, [summary])

  const deadlines = useMemo(() => {
    if (!summary?.deadlines?.length) {
      return [{ label: 'No upcoming deadlines', due: 'Add logs to generate a timeline', badge: 'badge-info' }]
    }

    return summary.deadlines.map(item => ({
      label: item.label,
      due: item.due,
      badge: item.badge || 'badge-info',
    }))
  }, [summary])

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
            {getGreeting()}, {firstName} 
          </h2>
          <p className="text-primary-200 text-sm mt-2 font-body">
            You have <span className="text-white font-semibold">{loading ? 'loading your summary' : `${summary?.stats?.pending_reviews || 0} pending review${(summary?.stats?.pending_reviews || 0) === 1 ? '' : 's'}`}</span> 
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <StatsCard key={item.label} icon={item.icon} label={item.label} value={item.value} color={item.color} trendLabel={item.trendLabel} />
        ))}
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
            {activity.map((item, i) => (
              <div key={`${item.label}-${i}`} className="flex gap-4 py-3 group">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <item.icon size={15} className={item.color} />
                  </div>
                  {i < activity.length - 1 && <div className="w-px h-full bg-gray-100 mt-1" />}
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
        </div>
      </div>
    </div>
  )
}
