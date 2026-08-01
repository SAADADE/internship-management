import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, FileText, MessageSquareQuote, User } from 'lucide-react'

const LOG_SHEET_DATA = [
  {
    id: 1,
    reportTitle: 'Week 1 - Onboarding & Setup',
    reportId: '#R001',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-15',
    section: 'Overall Quality',
    feedback: 'Excellent report! You demonstrated a clear understanding of the onboarding process and documented your learnings effectively. Keep up the great work!',
    summary: 'The student completed the onboarding process smoothly, documented their first-week responsibilities, and clearly outlined the tools and systems they were introduced to.',
    activities: [
      'Completed orientation and system setup.',
      'Documented the team structure and reporting channels.',
      'Recorded initial expectations for the internship period.'
    ],
    challenges: [
      'Needed more detail on how the onboarding steps affected day-to-day tasks.'
    ],
    learnings: [
      'Gained a clearer understanding of the company workflow.',
      'Learned the importance of accurate weekly documentation.'
    ]
  },
  {
    id: 2,
    reportTitle: 'Week 2 - Project Implementation',
    reportId: '#R002',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-10',
    section: 'Technical Details',
    feedback: 'Good progress on the project. Consider adding more technical details about the implementation challenges you faced and how you resolved them.',
    summary: 'The student started hands-on implementation work and described the project workflow with good clarity, though a few technical aspects need more depth.',
    activities: [
      'Implemented the first module of the project.',
      'Documented testing steps and debugging observations.',
      'Shared progress updates with the project team.'
    ],
    challenges: [
      'Encountered a few integration issues during early implementation.',
      'Needed more detail around decision-making during debugging.'
    ],
    learnings: [
      'Improved problem-solving during technical setbacks.',
      'Recognized the value of writing down solutions for future reference.'
    ]
  },
  {
    id: 3,
    reportTitle: 'Week 3 - Team Collaboration',
    reportId: '#R003',
    supervisor: 'Dr. Theresa',
    supervisorRole: 'Supervisor',
    date: '2026-03-05',
    section: 'Collaboration',
    feedback: 'Nice collaboration documentation. I would like to see more depth in your analysis of team dynamics and individual contributions.',
    summary: 'The student documented team involvement well and highlighted communication with peers, but would benefit from deeper reflection on collaboration outcomes.',
    activities: [
      'Participated in stand-up meetings and planning sessions.',
      'Coordinated with teammates on shared deliverables.',
      'Recorded feedback received from the team lead.'
    ],
    challenges: [
      'Needed stronger reflection on how team dynamics affected project progress.'
    ],
    learnings: [
      'Learned how collaboration improves task delivery.',
      'Understood the importance of constructive feedback in a team setting.'
    ]
  },
  {
    id: 4,
    reportTitle: 'Week 4 - System Testing',
    reportId: '#R004',
    supervisor: 'Dr. Ama Owusu',
    supervisorRole: 'Supervisor',
    date: '2026-02-28',
    section: 'Testing & QA',
    feedback: 'Testing documentation is comprehensive, but please focus on documenting edge cases and potential system failures in future reports.',
    summary: 'The student provided a solid testing summary and covered core validation steps, while the report could benefit from additional notes on edge cases.',
    activities: [
      'Ran functional tests for the core features.',
      'Noted issues found during validation.',
      'Tracked fixes and follow-up actions.'
    ],
    challenges: [
      'Some edge cases were not fully documented.',
      'Potential failure scenarios need more attention.'
    ],
    learnings: [
      'Improved understanding of test coverage.',
      'Learned to think proactively about system robustness.'
    ]
  }
]

export default function ViewFeedbackDetails() {
  const { id } = useParams()

  const logSheet = useMemo(() => {
    return LOG_SHEET_DATA.find((item) => String(item.id) === String(id)) || LOG_SHEET_DATA[0]
  }, [id])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/feedback" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
          <ArrowLeft size={16} />
          Back to feedback
        </Link>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Weekly log sheet</p>
          <h1 className="text-2xl font-bold text-gray-900">{logSheet.reportTitle}</h1>
          <p className="text-sm text-gray-500">{logSheet.reportId}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User size={16} className="text-gray-400" />
              Supervisor
            </div>
            <p className="text-gray-900 font-medium">{logSheet.supervisor}</p>
            <p className="text-sm text-gray-500">{logSheet.supervisorRole}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarDays size={16} className="text-gray-400" />
              Submitted
            </div>
            <p className="text-gray-900 font-medium">
              {new Date(logSheet.date).toLocaleDateString('en-GB', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-primary-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
            <FileText size={16} />
            Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-700">{logSheet.summary}</p>
        </div>
2
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Key activities</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {logSheet.activities.map((activity) => (
                <li key={activity} className="flex gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Challenges</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {logSheet.challenges.map((challenge) => (
                <li key={challenge} className="flex gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Key learnings</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {logSheet.learnings.map((learning) => (
              <li key={learning} className="flex gap-2">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{learning}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MessageSquareQuote size={16} className="text-gray-400" />
            Supervisor feedback
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-700">{logSheet.feedback}</p>
        </div>
      </div>
    </div>
  )
}
