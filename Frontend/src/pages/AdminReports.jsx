import { useState } from 'react'
import { FileText, Search, Filter, CheckCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react'

const ADMIN_REPORTS_DATA = [
  {
    id: 1,
    title: 'Week 1 - Onboarding & Setup',
    studentName: 'Peter Mensah',
    studentId: 'CS/0420/20',
    department: 'Computer Science',
    reportWeek: 'Week 1',
    submissionDate: '2024-03-15',
    dueDate: '2024-03-17',
    status: 'reviewed',
    rating: 5,
    company: 'Tech Innovation Ltd',
    supervisor: 'Dr. Theresa'
  },
  {
    id: 2,
    title: 'Week 2 - Project Implementation',
    studentName: 'Kwame Ofori',
    studentId: 'CS/0421/20',
    department: 'Computer Science',
    reportWeek: 'Week 2',
    submissionDate: '2024-03-10',
    dueDate: '2024-03-17',
    status: 'pending',
    rating: 0,
    company: 'Digital Solutions Inc',
    supervisor: 'Dr. Ama Owusu'
  },
  {
    id: 3,
    title: 'Week 1 - Onboarding & Setup',
    studentName: 'Ama Johnson',
    studentId: 'ENG/0422/20',
    department: 'Engineering',
    reportWeek: 'Week 1',
    submissionDate: '2024-03-14',
    dueDate: '2024-03-17',
    status: 'reviewed',
    rating: 4,
    company: 'Cloud Services Ltd',
    supervisor: 'Prof. John Asante'
  },
  {
    id: 4,
    title: 'Week 2 - Project Implementation',
    studentName: 'Yaa Asantewaa',
    studentId: 'BUS/0423/20',
    department: 'Business',
    reportWeek: 'Week 2',
    submissionDate: '2024-03-12',
    dueDate: '2024-03-17',
    status: 'pending',
    rating: 0,
    company: 'Enterprise Solutions',
    supervisor: 'Dr. Grace Mensah'
  },
  {
    id: 5,
    title: 'Week 3 - System Testing',
    studentName: 'Nana Ama Osei',
    studentId: 'CS/0424/20',
    department: 'Computer Science',
    reportWeek: 'Week 3',
    submissionDate: '2024-03-08',
    dueDate: '2024-03-17',
    status: 'late',
    rating: 3,
    company: 'Tech Innovations',
    supervisor: 'Dr. Ama Owusu'
  },
  {
    id: 6,
    title: 'Week 1 - Onboarding & Setup',
    studentName: 'Efua Mensah',
    studentId: 'ENG/0425/20',
    department: 'Engineering',
    reportWeek: 'Week 1',
    submissionDate: '2024-03-13',
    dueDate: '2024-03-17',
    status: 'reviewed',
    rating: 5,
    company: 'Tullow Oil Ghana',
    supervisor: 'Prof. John Asante'
  }
]

export default function AdminReports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const departments = ['all', ...new Set(ADMIN_REPORTS_DATA.map(r => r.department))]

  const filteredReports = ADMIN_REPORTS_DATA.filter(report => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDept = filterDept === 'all' || report.department === filterDept
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus

    return matchesSearch && matchesDept && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="badge-success">Reviewed</span>
      case 'pending':
        return <span className="badge-warning">Pending</span>
      case 'late':
        return <span className="badge-error">Late</span>
      default:
        return null
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircle size={16} className="text-emerald-600" />
      case 'pending':
        return <Clock size={16} className="text-amber-600" />
      case 'late':
        return <AlertCircle size={16} className="text-red-600" />
      default:
        return null
    }
  }

  const reviewedCount = ADMIN_REPORTS_DATA.filter(r => r.status === 'reviewed').length
  const pendingCount = ADMIN_REPORTS_DATA.filter(r => r.status === 'pending').length
  const lateCount = ADMIN_REPORTS_DATA.filter(r => r.status === 'late').length
  const avgRating = (ADMIN_REPORTS_DATA.reduce((sum, r) => sum + r.rating, 0) / reviewedCount).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">All Reports</h1>
          <p className="text-gray-500 mt-1">Monitor all student internship reports across departments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-gray-600 text-sm font-medium">Total Reports</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{ADMIN_REPORTS_DATA.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm font-medium">Reviewed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{reviewedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{pendingCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm font-medium">Late</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{lateCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm font-medium">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{avgRating}⭐</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or report title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <span className="text-sm font-medium text-gray-700">Filter:</span>

          <div className="flex gap-2 flex-wrap">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterDept === dept
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept === 'all' ? 'All Depts' : dept}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap ml-auto">
            {['all', 'reviewed', 'pending', 'late'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No reports found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-200">
              <tr>
                <th className="table-header text-left">Student</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Report</th>
                <th className="table-header text-left">Week</th>
                <th className="table-header text-center">Submitted</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Rating</th>
                <th className="table-header text-center">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report, idx) => (
                <tr key={report.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 ? 'bg-gray-50/30' : ''}`}>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{report.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{report.studentId}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {report.department}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-gray-900">{report.title}</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-700">{report.reportWeek}</span>
                  </td>
                  <td className="table-cell text-center">
                    <p className="text-xs text-gray-500">
                      {new Date(report.submissionDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </p>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(report.status)}
                      {getStatusBadge(report.status)}
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    {report.status === 'pending' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex justify-center">
                        <span className="text-yellow-500 font-semibold">{report.rating}⭐</span>
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <p className="text-sm text-gray-700">{report.supervisor}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
