import { useMemo, useState } from 'react'
import { FileText, Search, ClipboardCheck, Eye, X } from 'lucide-react'

const FINAL_REPORTS = [
  {
    id: 1,
    studentName: 'Peter Mensah',
    studentId: 'CS/0420/20',
    department: 'Computer Science',
    title: 'Final Internship Report',
    submittedOn: '2024-03-15',
  },
  {
    id: 2,
    studentName: 'Ama Johnson',
    studentId: 'ENG/0422/20',
    department: 'Engineering',
    title: 'Final Internship Report',
    submittedOn: '2024-03-14',
  },
  {
    id: 3,
    studentName: 'Yaa Asantewaa',
    studentId: 'BUS/0423/20',
    department: 'Business',
    title: 'Final Internship Report',
    submittedOn: '2024-03-12',
  },
]

const APPRAISAL_FORMS = [
  {
    id: 1,
    studentName: 'Kwame Ofori',
    studentId: 'CS/0421/20',
    supervisorName: 'Dr. Ama Owusu',
    submittedOn: '2024-03-10',
  },
  {
    id: 2,
    studentName: 'Efua Mensah',
    studentId: 'ENG/0425/20',
    supervisorName: 'Prof. John Asante',
    submittedOn: '2024-03-13',
  },
  {
    id: 3,
    studentName: 'Nana Ama Osei',
    studentId: 'CS/0424/20',
    supervisorName: 'Dr. Grace Mensah',
    submittedOn: '2024-03-08',
  },
]

const FINAL_REPORT_DETAILS = {
  1: {
    title: 'Final Internship Report',
    summary: 'The student completed a full internship cycle with strong technical delivery and clear reflection on workplace learning.',
    sections: [
      'Abstract: This report documents the student’s contribution to software testing and support during the internship placement.',
      'Introduction: The internship was undertaken at Tech Innovation Ltd, where the student worked with the operations and IT support teams.',
      'Conclusion: The student demonstrated professionalism, adaptability, and a strengthened understanding of real-world workplace systems.'
    ]
  },
  2: {
    title: 'Final Internship Report',
    summary: 'The student worked on process improvement initiatives and presented a strong understanding of engineering practices.',
    sections: [
      'Abstract: The report reflects the student’s involvement in a structural engineering support project during the internship.',
      'Introduction: The placement at Cloud Services Ltd provided practical exposure to engineering documentation and operations.',
      'Conclusion: The internship helped the student connect academic learning with professional engineering expectations.'
    ]
  },
  3: {
    title: 'Final Internship Report',
    summary: 'The student contributed to business process documentation and gained useful exposure to stakeholder communication.',
    sections: [
      'Abstract: This report highlights the student’s work in a business operations setting and their role in supporting internal reporting.',
      'Introduction: The internship at Enterprise Solutions introduced the student to business analysis and project coordination.',
      'Conclusion: The experience built confidence in communication, planning, and professional teamwork.'
    ]
  },
}

const APPRAISAL_DETAILS = {
  1: {
    title: 'Supervisor Appraisal Form',
    rating: '4.5/5',
    strengths: ['Excellent communication', 'Reliable on deadlines', 'Adapted quickly to the team environment'],
    comments: 'The student showed maturity, initiative, and a strong attitude towards learning. They were dependable and contributed positively to team activities.'
  },
  2: {
    title: 'Supervisor Appraisal Form',
    rating: '4.0/5',
    strengths: ['Good technical understanding', 'Willing to ask questions', 'Professional conduct'],
    comments: 'The student was eager to learn and made steady progress throughout the placement. Their work quality improved significantly over time.'
  },
  3: {
    title: 'Supervisor Appraisal Form',
    rating: '4.2/5',
    strengths: ['Strong teamwork', 'Organized and punctual', 'Showed ownership of tasks'],
    comments: 'The student handled responsibility well and demonstrated a positive professional attitude during the internship period.'
  },
}

export default function AdminReports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedAppraisal, setSelectedAppraisal] = useState(null)

  const filteredFinalReports = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return FINAL_REPORTS.filter((report) =>
      report.studentName.toLowerCase().includes(query) ||
      report.studentId.toLowerCase().includes(query) ||
      report.department.toLowerCase().includes(query)
    )
  }, [searchTerm])

  const filteredAppraisals = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return APPRAISAL_FORMS.filter((form) =>
      form.studentName.toLowerCase().includes(query) ||
      form.studentId.toLowerCase().includes(query) ||
      form.supervisorName.toLowerCase().includes(query)
    )
  }, [searchTerm])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Student Final Reports & Appraisals</h1>
        <p className="text-gray-500">Review submitted final reports from students and appraisal forms from supervisors.</p>
      </div>

      <div className="card p-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, ID, department, or supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary-600" />
              <h2 className="section-title">Student Final Reports</h2>
            </div>
          </div>

          {filteredFinalReports.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No final reports found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFinalReports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{report.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{report.studentId}</p>
                      <p className="mt-2 text-sm text-gray-600">{report.title}</p>
                      <p className="text-xs text-gray-400">Department: {report.department}</p>
                    </div>
                    <span className="badge-success">Submitted</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">Submitted on {new Date(report.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <button type="button" onClick={() => setSelectedReport(report)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                      <Eye size={14} /> View report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-primary-600" />
              <h2 className="section-title">Supervisor Appraisal Forms</h2>
            </div>
          </div>

          {filteredAppraisals.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No appraisal forms found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppraisals.map((form) => (
                <div key={form.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{form.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">{form.studentId}</p>
                      <p className="mt-2 text-sm text-gray-600">Supervisor: {form.supervisorName}</p>
                    </div>
                    <span className="badge-info">Received</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">Submitted on {new Date(form.submittedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <button type="button" onClick={() => setSelectedAppraisal(form)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                      <Eye size={14} /> View form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(selectedReport || selectedAppraisal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedReport ? FINAL_REPORT_DETAILS[selectedReport.id]?.title : APPRAISAL_DETAILS[selectedAppraisal.id]?.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedReport
                    ? `${selectedReport.studentName} • ${selectedReport.studentId}`
                    : `${selectedAppraisal.studentName} • ${selectedAppraisal.studentId}`}
                </p>
              </div>
              <button type="button" onClick={() => { setSelectedReport(null); setSelectedAppraisal(null) }} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {selectedReport && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">Summary</p>
                  <p className="mt-2 text-sm text-gray-600">{FINAL_REPORT_DETAILS[selectedReport.id]?.summary}</p>
                </div>
                <div className="space-y-3">
                  {FINAL_REPORT_DETAILS[selectedReport.id]?.sections.map((section, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 p-4">
                      <p className="text-sm text-gray-700">{section}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAppraisal && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">Supervisor</p>
                  <p className="mt-1 text-sm text-gray-600">{selectedAppraisal.supervisorName}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Rating</p>
                  <p className="mt-2 text-sm text-gray-600">{APPRAISAL_DETAILS[selectedAppraisal.id]?.rating}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Strengths</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {APPRAISAL_DETAILS[selectedAppraisal.id]?.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Comments</p>
                  <p className="mt-2 text-sm text-gray-600">{APPRAISAL_DETAILS[selectedAppraisal.id]?.comments}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
