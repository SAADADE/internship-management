import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { FileText, Sparkles, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'

const sectionConfig = [
  { key: 'abstract', label: 'Abstract', placeholder: 'Summarize the purpose, methods, and key outcomes of your internship experience.' },
  { key: 'introduction', label: 'Introduction', placeholder: 'Introduce the internship context, organization, and your learning objectives.' },
  { key: 'conclusion', label: 'Conclusion', placeholder: 'Reflect on what you learned, the impact of your work, and your final takeaway.' },
]

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function RichTextEditor({ label, placeholder, value, onChange }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyFormat = (command, valueArg = null) => {
    document.execCommand(command, false, valueArg)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      editorRef.current.focus()
    }
  }

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <button type="button" onClick={() => applyFormat('bold')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" title="Bold">
            <Bold size={16} />
          </button>
          <button type="button" onClick={() => applyFormat('italic')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" title="Italic">
            <Italic size={16} />
          </button>
          <button type="button" onClick={() => applyFormat('underline')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" title="Underline">
            <Underline size={16} />
          </button>
          <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" title="Bullet list">
            <List size={16} />
          </button>
          <button type="button" onClick={() => applyFormat('insertOrderedList')} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" title="Numbered list">
            <ListOrdered size={16} />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          data-placeholder={placeholder}
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="rich-text-editor min-h-[180px] p-4 text-sm leading-7 text-gray-700 outline-none text-left"
          style={{ direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        />
      </div>
    </div>
  )
}

export default function GenerateReport() {
  const { user } = useAuth()
  const [content, setContent] = useState({ abstract: '', introduction: '', conclusion: '' })
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (key, value) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const emptySections = sectionConfig.filter(({ key }) => stripHtml(content[key]).length === 0)
    if (emptySections.length > 0) {
      setSubmitted(false)
      setMessage('Please complete all three sections before generating the report draft.')
      return
    }

    setSubmitted(true)
    setMessage(`Your report draft for ${user?.name || 'the student'} is ready for review.`)
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="card p-8 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              <Sparkles size={16} /> Generate Report
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">Create your internship report </h1>
            <p className="text-sm text-gray-500">Write your abstract, introduction, and conclusion in the sections below to prepare your report.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-semibold">
              <FileText size={16} /> Guided report builder
            </div>
            <p className="mt-1">Use the formatting tools to structure your content clearly before submission.</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {sectionConfig.map((section) => (
            <RichTextEditor
              key={section.key}
              label={section.label}
              placeholder={section.placeholder}
              value={content[section.key]}
              onChange={(value) => handleChange(section.key, value)}
            />
          ))}

          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${submitted ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">Generate Report </button>
            <button type="button" onClick={() => setContent({ abstract: '', introduction: '', conclusion: '' })} className="btn-secondary">Clear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
