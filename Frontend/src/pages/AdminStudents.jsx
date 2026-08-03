import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Search, Mail, Briefcase, Calendar, MapPin, MoreVertical, Printer } from 'lucide-react'
import { getStoredAppraisals } from '../utils/storage'

const STUDENTS_DATA = [
  {
    id: 1,
    name: 'Peter Mensah',
    studentId: 'CS/0420/20',
    email: 'peter.mensah@email.com',
    department: 'Computer Science',
    company: 'Tech Innovation Ltd',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-31'
  },
  {
    id: 2,
    name: 'Kwame Ofori',
    studentId: 'CS/0421/20',
    email: 'kwame.ofori@email.com',
    department: 'Computer Science',
    company: 'Digital Solutions Inc',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-31'
  },
  {
    id: 3,
    name: 'Ama Johnson',
    studentId: 'ENG/0422/20',
    email: 'ama.johnson@email.com',
    department: 'Engineering',
    company: 'Cloud Services Ltd',
    status: 'active',
    startDate: '2024-02-15',
    endDate: '2024-06-15'
  },
  {
    id: 4,
    name: 'Yaa Asantewaa',
    studentId: 'BUS/0423/20',
    email: 'yaa.asantewaa@email.com',
    department: 'Business',
    company: 'Enterprise Solutions',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-06-30'
  },
  {
    id: 5,
    name: 'Nana Ama Osei',
    studentId: 'CS/0424/20',
    email: 'nana.osei@email.com',
    department: 'Computer Science',
    company: 'Tech Innovations',
    status: 'completed',
    startDate: '2024-01-15',
    endDate: '2024-04-30'
  },
  {
    id: 6,
    name: 'Efua Mensah',
    studentId: 'ENG/0425/20',
    email: 'efua.mensah@email.com',
    department: 'Engineering',
    company: 'Tullow Oil Ghana',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-31'
  }
]

export default function AdminStudents() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const appraisals = getStoredAppraisals()

  const departments = ['all', ...new Set(STUDENTS_DATA.map(s => s.department))]

  const filteredStudents = STUDENTS_DATA.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDept = filterDept === 'all' || student.department === filterDept

    return matchesSearch && matchesDept
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge-success">Active</span>
      case 'completed':
        return <span className="badge-primary">Completed</span>
      case 'inactive':
        return <span className="badge-error">Inactive</span>
      default:
        return null
    }
  }

  const activeCount = STUDENTS_DATA.filter(s => s.status === 'active').length
  const completedCount = STUDENTS_DATA.filter(s => s.status === 'completed').length
  const summary = useMemo(() => {
    const byCollege = STUDENTS_DATA.reduce((acc, student) => {
      const college = student.department || 'Unassigned'
      acc[college] = (acc[college] || 0) + 1
      return acc
    }, {})
    return Object.entries(byCollege).map(([college, count]) => ({ college, count }))
  }, [])

  const handlePrint = () => {
    const grouped = filteredStudents.reduce((acc, student) => {
      const group = student.department || 'Unassigned'
      if (!acc[group]) acc[group] = []
      acc[group].push(student)
      return acc
    }, {})

    const rows = Object.entries(grouped).map(([group, students]) => {
      const innerRows = students.map((student) => {
        const appraisal = appraisals.find((item) => item.studentId === student.studentId)
        const score = appraisal?.criteria?.length
          ? appraisal.criteria.reduce((sum, criterion) => sum + Number(criterion.score || 0), 0)
          : 'Pending'
        return `<tr><td style="border:1px solid #ddd;padding:8px">${student.name}</td><td style="border:1px solid #ddd;padding:8px">${student.studentId}</td><td style="border:1px solid #ddd;padding:8px">${student.department}</td><td style="border:1px solid #ddd;padding:8px">${student.company}</td><td style="border:1px solid #ddd;padding:8px">${score === 'Pending' ? 'Pending' : `${score}/45`}</td></tr>`
      }).join('')
      return `<tr><td colspan="5" style="border:1px solid #ddd;padding:8px;font-weight:bold;background:#f8fafc">${group}</td></tr>${innerRows}`
    }).join('')

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Student Marks Summary</title></head><body style="font-family:Arial,sans-serif;padding:20px"><h2>Student Marks Summary</h2><p>Grouped by college/programme</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="border:1px solid #ddd;padding:8px">Student</th><th style="border:1px solid #ddd;padding:8px">ID</th><th style="border:1px solid #ddd;padding:8px">College/Programme</th><th style="border:1px solid #ddd;padding:8px">Company</th><th style="border:1px solid #ddd;padding:8px">Marks</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Students</h1>
          <p className="text-gray-500 mt-1">Manage and monitor student internships</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-gray-600">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{STUDENTS_DATA.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> Print Summary
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterDept === dept
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700">College / Programme summary</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.map((item) => (
            <span key={item.college} className="rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm">
              {item.college}: {item.count}
            </span>
          ))}
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full text-center card p-12">
            <GraduationCap size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No students found</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div key={student.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <GraduationCap size={24} className="text-primary-600" />
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-1">{student.name}</h3>
              <p className="text-xs text-gray-500 font-mono mb-3">{student.studentId}</p>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <a href={`mailto:${student.email}`} className="text-gray-600 hover:text-primary-600 truncate">
                    {student.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={14} className="text-gray-400" />
                  <span className="text-gray-600">{student.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-xs">{student.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-xs">
                    {new Date(student.startDate).toLocaleDateString()} - {new Date(student.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {getStatusBadge(student.status)}
                <button onClick={() => navigate(`/admin/students/${student.id}`)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
