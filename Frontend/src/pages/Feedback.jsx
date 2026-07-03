import { useState } from 'react'
import { MessageSquare, Star, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEEDBACK_DATA = [
  {
    id: 1,
    reportTitle: 'Week 1 - Onboarding & Setup',
    reportId: '#R001',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-15',
    rating: 5,
    feedback: 'Excellent report! You demonstrated a clear understanding of the onboarding process and documented your learnings effectively. Keep up the great work!',
    status: 'read',
    section: 'Overall Quality'
  },
  {
    id: 2,
    reportTitle: 'Week 2 - Project Implementation',
    reportId: '#R002',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-10',
    rating: 4,
    feedback: 'Good progress on the project. Consider adding more technical details about the implementation challenges you faced and how you resolved them.',
    status: 'unread',
    section: 'Technical Details'
  },
  {
    id: 3,
    reportTitle: 'Week 3 - Team Collaboration',
    reportId: '#R003',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-05',
    rating: 4,
    feedback: 'Nice collaboration documentation. I would like to see more depth in your analysis of team dynamics and individual contributions.',
    status: 'read',
    section: 'Collaboration'
  },
  {
    id: 4,
    reportTitle: 'Week 4 - System Testing',
    reportId: '#R004',
    supervisor: 'Dr. Ama Owusu',
    supervisorRole: 'Supervisor',
    date: '2026-02-28',
    rating: 3,
    feedback: 'Testing documentation is comprehensive, but please focus on documenting edge cases and potential system failures in future reports.',
    status: 'read',
    section: 'Testing & QA'
  }
]

export default function Feedback() {
  const { user } = useAuth()
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const unreadCount = FEEDBACK_DATA.filter(f => f.status === 'unread').length
  
  const filteredFeedback = filterStatus === 'all' 
    ? FEEDBACK_DATA 
    : FEEDBACK_DATA.filter(f => f.status === filterStatus)

  const StarRating = ({ rating, size = 16 }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Feedback</h1>
          <p className="text-gray-500 mt-1">Review feedback from your supervisors</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <p className="text-sm font-semibold text-blue-700">{unreadCount} unread</p>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            filterStatus === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({FEEDBACK_DATA.length})
        </button>
        <button
          onClick={() => setFilterStatus('unread')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            filterStatus === 'unread'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feedback List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredFeedback.length === 0 ? (
            <div className="card p-8 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No feedback available yet</p>
            </div>
          ) : (
            filteredFeedback.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedFeedback(item)}
                className={`card p-5 text-left transition-all hover:shadow-md cursor-pointer border-l-4 w-full ${
                  selectedFeedback?.id === item.id
                    ? 'border-l-primary-600 bg-primary-50'
                    : item.status === 'unread'
                    ? 'border-l-blue-500 bg-blue-50/40'
                    : 'border-l-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{item.reportTitle}</h3>
                      {item.status === 'unread' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{item.reportId}</p>
                    <div className="mb-2">
                      <StarRating rating={item.rating} size={14} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.feedback}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Feedback Details */}
        <div className="lg:col-span-1">
          {selectedFeedback ? (
            <div className="card p-6 sticky top-20 space-y-5">
              <div>
                <h2 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  {selectedFeedback.reportTitle}
                </h2>
                <p className="text-sm text-gray-500">{selectedFeedback.reportId}</p>
              </div>

              <div className="space-y-3 border-t pt-5">
                <div className="flex items-start gap-3">
                  <User size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">From</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedFeedback.supervisor}</p>
                    <p className="text-xs text-gray-500">{selectedFeedback.supervisorRole}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedFeedback.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Star size={16} className="text-yellow-400 mt-1 flex-shrink-0 fill-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Rating</p>
                    <StarRating rating={selectedFeedback.rating} size={16} />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {selectedFeedback.status === 'unread' ? (
                    <AlertCircle size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                  ) : (
                    <CheckCircle size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <p className={`text-sm font-semibold ${selectedFeedback.status === 'unread' ? 'text-blue-700' : 'text-emerald-700'}`}>
                      {selectedFeedback.status === 'unread' ? 'Unread' : 'Read'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5">
                <p className="text-xs text-gray-500 font-medium mb-2">SECTION</p>
                <p className="text-sm font-semibold text-gray-900">{selectedFeedback.section}</p>
              </div>

              <div className="border-t pt-5">
                <p className="text-xs text-gray-500 font-medium mb-3">FEEDBACK</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedFeedback.feedback}</p>
              </div>

              <button className="w-full btn-primary text-sm">
                View Full Report
              </button>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Select feedback to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
