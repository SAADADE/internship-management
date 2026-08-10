import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { FileText, Sparkles, Bold, Italic, Underline, List, ListOrdered, UploadCloud, CheckCircle, Download } from 'lucide-react'
import { generateStudentReport, getStudentInternships, saveReportDraft, uploadStudentReportFile } from '../api'

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
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('generate')
  const [selectedFile, setSelectedFile] = useState(null)
  const [generatedReport, setGeneratedReport] = useState(null)
  const [showGeneratedModal, setShowGeneratedModal] = useState(false)
  const [internships, setInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('')

  useEffect(() => {
    let active = true

    if (user?.role !== 'student') return undefined

    getStudentInternships()
      .then((response) => {
        if (!active) return
        const normalized = Array.isArray(response) ? response : []
        setInternships(normalized)
        setSelectedInternshipId((current) => current || normalized[0]?.internship_id || '')
      })
      .catch(() => {
        if (!active) return
        setInternships([])
      })

    return () => {
      active = false
    }
  }, [user?.role])

  const selectedInternship = useMemo(
    () => internships.find((item) => item.internship_id === selectedInternshipId) || internships[0] || null,
    [internships, selectedInternshipId]
  )

  useEffect(() => {
    return () => {
      if (generatedReport?.url) {
        window.URL.revokeObjectURL(generatedReport.url)
      }
    }
  }, [generatedReport])

  const handleChange = (key, value) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const handleDownloadGeneratedReport = () => {
    if (!generatedReport?.url) return

    const link = document.createElement('a')
    link.href = generatedReport.url
    link.download = generatedReport.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCloseGeneratedReport = () => {
    setShowGeneratedModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'upload') {
      if (!selectedFile) {
        setSubmitted(false)
        setMessage('Please choose a final report file before uploading.')
        return
      }

      setLoading(true)
      setMessage(`Uploading ${selectedFile.name} for review...`)
      try {
        await uploadStudentReportFile(selectedFile)
        setSubmitted(true)
        setMessage(`Your final report ${selectedFile.name} has been submitted successfully.`)
      } catch (err) {
        setSubmitted(false)
        setMessage(err.message || 'Unable to upload your report right now.')
      } finally {
        setLoading(false)
      }
      return
    }

    const emptySections = sectionConfig.filter(({ key }) => stripHtml(content[key]).length === 0)
    if (emptySections.length > 0) {
      setSubmitted(false)
      setMessage('Please complete all three sections before generating the report draft.')
      return
    }

    if (!selectedInternship) {
      setSubmitted(false)
      setMessage('Please select the internship you want this report to cover.')
      return
    }

    setLoading(true)
    setMessage('Saving your draft and generating the report...')

    try {
      await saveReportDraft({
        introduction: content.introduction,
        abstract: content.abstract,
        conclusion: content.conclusion,
      })

      const blob = await generateStudentReport({ internship_id: selectedInternship.internship_id })
      const nextUrl = window.URL.createObjectURL(blob)
      const nextFilename = `internship_report_${(user?.name || user?.username || 'student').replace(/\s+/g, '_').toLowerCase()}.docx`

      setGeneratedReport((current) => {
        if (current?.url) {
          window.URL.revokeObjectURL(current.url)
        }
        return { url: nextUrl, filename: nextFilename }
      })

      setSubmitted(true)
      setShowGeneratedModal(true)
      setMessage(`Your report draft for ${user?.name || 'the student'} is ready to download.`)
    } catch (err) {
      setSubmitted(false)
      setMessage(err.message || 'Unable to generate the report right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      {generatedReport && showGeneratedModal && mode === 'generate' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={28} />
            </div>
            <div className="mt-4 text-center">
              <h2 className="font-heading text-xl font-bold text-gray-900">Report generated successfully</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your internship report is ready. Download the document below.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" onClick={handleDownloadGeneratedReport} className="btn-primary inline-flex items-center justify-center gap-2">
                <Download size={16} /> Download Report
              </button>
              <button type="button" onClick={handleCloseGeneratedReport} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode('generate')} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'generate' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Generate report
          </button>
          <button type="button" onClick={() => setMode('upload')} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'upload' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Upload final report
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Select internship for this report</h2>
            <p className="mt-1 text-sm text-gray-500">The report will only use reviewed logs from the internship you choose here.</p>
          </div>
          {internships.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <select
                className="form-input"
                value={selectedInternshipId}
                onChange={(e) => setSelectedInternshipId(e.target.value)}
              >
                {internships.map((internship) => (
                  <option key={internship.internship_id} value={internship.internship_id}>
                    {internship.company_name} - {internship.internship_position || 'Internship'}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 md:text-right">
                {selectedInternship ? (
                  <>
                    <p className="font-medium text-gray-700">{selectedInternship.company_name}</p>
                  </>
                ) : (
                  <p>No internship selected.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-700">Register an internship first before generating a report.</p>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {mode === 'generate' ? (
            sectionConfig.map((section) => (
              <RichTextEditor
                key={section.key}
                label={section.label}
                placeholder={section.placeholder}
                value={content[section.key]}
                onChange={(value) => handleChange(section.key, value)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UploadCloud size={16} /> Upload final report
              </div>
              <p className="mt-2 text-sm text-gray-500">Choose a PDF or Word document to submit as your final report.</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="mt-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && <p className="mt-3 text-sm text-emerald-700">Selected file: {selectedFile.name}</p>}
            </div>
          )}

          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${submitted ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {message}
            </div>
          )}

          {generatedReport ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-emerald-900">Your report is ready</h3>
                <p className="text-sm text-emerald-700">You can download it now or close the modal and return here later.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleDownloadGeneratedReport} className="btn-primary inline-flex items-center gap-2">
                  <Download size={16} /> Download Report
                </button>
                <button type="button" onClick={handleCloseGeneratedReport} className="btn-secondary">
                  Hide Success Message
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-70">
              {loading ? (mode === 'upload' ? 'Uploading...' : 'Generating...') : mode === 'upload' ? 'Upload Report' : 'Generate Report'}
            </button>
            <button type="button" onClick={() => setContent({ abstract: '', introduction: '', conclusion: '' })} className="btn-secondary">Clear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
