import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Mail, Briefcase, Calendar, MapPin, FileText, CheckCircle, Clock3 } from 'lucide-react'

const STUDENT_DATA = [
  {
    id: 1,
    name: 'Peter Mensah',
    studentId: 'CS/0420/20',
    email: 'peter.mensah@email.com',
    department: 'Computer Science',
    company: 'Tech Innovation Ltd',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-31',
    supervisor: 'Dr. Ama Owusu',
    phone: '+233 24 123 4567',
    address: 'Accra, Ghana',
    reportStatus: 'Submitted',
    appraisalStatus: 'Received',
    summary: 'Peter has shown strong technical growth, consistent punctuality, and a proactive approach to assigned tasks during the internship period.',
    achievements: ['Completed software testing and support tasks', 'Worked well with cross-functional teams', 'Maintained clear technical documentation']
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
    endDate: '2024-05-31',
    supervisor: 'Prof. John Asante',
    phone: '+233 20 456 7890',
    address: 'Kumasi, Ghana',
    reportStatus: 'Pending Review',
    appraisalStatus: 'Received',
    summary: 'Kwame demonstrated a solid grasp of technical fundamentals and steady improvement in handling real-world responsibilities.',
    achievements: ['Delivered support for internal systems', 'Improved problem-solving under supervision', 'Maintained professional communication']
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
    endDate: '2024-06-15',
    supervisor: 'Dr. Grace Mensah',
    phone: '+233 27 678 9012',
    address: 'Takoradi, Ghana',
    reportStatus: 'Submitted',
    appraisalStatus: 'Pending',
    summary: 'Ama has shown a thoughtful approach to engineering tasks and has built strong professional habits during placement.',
    achievements: ['Assisted with technical documentation', 'Showed strong teamwork', 'Adapted quickly to field work']
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
    endDate: '2024-06-30',
    supervisor: 'Mr. Kofi Boateng',
    phone: '+233 26 345 6789',
    address: 'Ho, Ghana',
    reportStatus: 'Submitted',
    appraisalStatus: 'Received',
    summary: 'Yaa has shown professionalism, clear communication, and strong ownership of assigned responsibilities.',
    achievements: ['Supported business operations tasks', 'Produced polished reports', 'Built confidence in stakeholder communication']
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
    endDate: '2024-04-30',
    supervisor: 'Dr. Rebecca Appiah',
    phone: '+233 24 987 6543',
    address: 'Tamale, Ghana',
    reportStatus: 'Reviewed',
    appraisalStatus: 'Received',
    summary: 'Nana Ama completed the internship successfully and demonstrated excellent professionalism throughout the placement.',
    achievements: ['Completed all assigned tasks', 'Exceeded expectations in communication', 'Delivered a strong final report']
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
    endDate: '2024-05-31',
    supervisor: 'Prof. Daniel Addo',
    phone: '+233 20 111 2222',
    address: 'Sunyani, Ghana',
    reportStatus: 'Pending Review',
    appraisalStatus: 'Received',
    summary: 'Efua has shown resilience and a strong willingness to learn while handling engineering-related responsibilities.',
    achievements: ['Assisted with field observations', 'Maintained professional conduct', 'Showed strong learning attitude']
  }
]

export default function AdminStudentView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const student = STUDENT_DATA.find((item) => item.id === Number(id))

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Student not found</h1>
        <p className="mt-2 text-sm text-gray-500">The requested student profile could not be found.</p>
        <button onClick={() => navigate('/admin/students')} className="btn-primary mt-6">
          Back to Students
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Back to students
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <GraduationCap size={28} className="text-primary-600" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="font-mono text-sm text-gray-500">{student.studentId}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${student.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {student.status === 'completed' ? 'Completed' : 'Active'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Email</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" /> {student.email}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Phone</p>
              <p className="mt-1 text-sm text-gray-600">{student.phone}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Department</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap size={14} className="text-gray-400" /> {student.department}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Location</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" /> {student.address}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800">Internship Overview</h2>
            <p className="mt-3 text-sm text-gray-600">{student.summary}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Placement Details</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Briefcase size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Company</p>
                  <p>{student.company}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Dates</p>
                  <p>{new Date(student.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(student.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-700">Supervisor</p>
                  <p>{student.supervisor}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Progress Status</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Final Report</span>
                  <span className="text-sm font-semibold text-primary-700">{student.reportStatus}</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Appraisal Form</span>
                  <span className="text-sm font-semibold text-primary-700">{student.appraisalStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800">Key Achievements</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {student.achievements.map((achievement) => (
                <li key={achievement} className="flex items-start gap-2">
                  <CheckCircle size={14} className="mt-0.5 text-emerald-500" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
