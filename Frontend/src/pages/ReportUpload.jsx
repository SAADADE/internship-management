import { useState } from 'react'

const studentFields = [
  { label: 'Student Name', name: 'studentName', placeholder: 'Enter full name' },
  { label: 'Student ID', name: 'studentId', placeholder: 'Enter student ID' },
  { label: 'Department', name: 'department', placeholder: 'Department name' },
  { label: 'Programme', name: 'programme', placeholder: 'Programme name' },
  { label: 'Level', name: 'level', placeholder: 'e.g. 300' },
  { label: 'Institution', name: 'institution', placeholder: 'Institution name' }
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function ReportUpload() {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    department: '',
    programme: '',
    level: '',
    institution: '',
    mondayTasks: '',
    mondaySkills: '',
    mondayChallenges: '',
    mondaySolutions: '',
    tuesdayTasks: '',
    tuesdaySkills: '',
    tuesdayChallenges: '',
    tuesdaySolutions: '',
    wednesdayTasks: '',
    wednesdaySkills: '',
    wednesdayChallenges: '',
    wednesdaySolutions: '',
    thursdayTasks: '',
    thursdaySkills: '',
    thursdayChallenges: '',
    thursdaySolutions: '',
    fridayTasks: '',
    fridaySkills: '',
    fridayChallenges: '',
    fridaySolutions: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="card p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Weekly Internship Log Sheet</h1>
          <p className="text-sm text-gray-500">Record your weekly internship activities and reflections.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Student Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {studentFields.map((field) => (
              <div key={field.name}>
                <label className="form-label">{field.label}</label>
                <input
                  className="form-input"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Internship Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Company name" />
            </div>
            <div>
              <label className="form-label">Department/Unit</label>
              <input className="form-input" placeholder="Department or unit" />
            </div>
            <div>
              <label className="form-label">Industry Supervisor</label>
              <input className="form-input" placeholder="Supervisor name" />
            </div>
            <div>
              <label className="form-label">Week Number</label>
              <input className="form-input" placeholder="e.g. Week 1" />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input className="form-input" placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input className="form-input" placeholder="YYYY-MM-DD" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Daily Activities</h2>

          {days.map((day) => {
            const taskKey = `${day.toLowerCase()}Tasks`
            const skillKey = `${day.toLowerCase()}Skills`
            const challengeKey = `${day.toLowerCase()}Challenges`
            const solutionKey = `${day.toLowerCase()}Solutions`

            return (
              <div key={day} className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-700">{day}</h3>

                <div>
                  <label className="form-label">Tasks Performed</label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={taskKey}
                    value={formData[taskKey]}
                    onChange={handleChange}
                    placeholder={`Describe the tasks completed on ${day.toLowerCase()}.`}
                  />
                </div>

                <div>
                  <label className="form-label">Skills Learned</label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={skillKey}
                    value={formData[skillKey]}
                    onChange={handleChange}
                    placeholder={`Mention the skills gained on ${day.toLowerCase()}.`}
                  />
                </div>

                <div>
                  <label className="form-label">Challenges Encountered <span className="text-gray-400">(Optional)</span></label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={challengeKey}
                    value={formData[challengeKey]}
                    onChange={handleChange}
                    placeholder={`Note any challenges faced on ${day.toLowerCase()}.`}
                  />
                </div>

                <div>
                  <label className="form-label">Solutions Applied <span className="text-gray-400">(Optional)</span></label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    name={solutionKey}
                    value={formData[solutionKey]}
                    onChange={handleChange}
                    placeholder={`Describe how those challenges were addressed.`}
                  />
                </div>
              </div>
            )
          })}
        </section>

        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label className="text-sm text-gray-600">
            I confirm that the information submitted is accurate and represents the activities completed during this internship week.
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary">Save Draft</button>
          <button type="submit" className="btn-primary">Submit Weekly Log</button>
        </div>
      </div>
    </div>
  )
}
