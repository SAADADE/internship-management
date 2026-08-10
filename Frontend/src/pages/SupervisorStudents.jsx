import { useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { getSupervisorStudents } from '../api'

function formatName(student) {
  const first = (student?.first_name || '').trim()
  const last = (student?.last_name || '').trim()
  const combined = `${first} ${last}`.trim()
  return combined || student?.sch_email || 'Unknown Student'
}

export default function SupervisorStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let active = true

    async function loadStudents() {
      setLoading(true)
      setError('')

      try {
        const response = await getSupervisorStudents()
        if (!active) return
        setStudents(Array.isArray(response) ? response : [])
      } catch (loadError) {
        if (!active) return
        setError(loadError?.message || 'Unable to load assigned students.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStudents()
    return () => {
      active = false
    }
  }, [])

  const filteredStudents = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return students

    return students.filter((student) => {
      return (
        formatName(student).toLowerCase().includes(query)
        || (student?.sch_email || '').toLowerCase().includes(query)
        || (student?.institution_name || '').toLowerCase().includes(query)
        || (student?.department || '').toLowerCase().includes(query)
        || (student?.programme || '').toLowerCase().includes(query)
      )
    })
  }, [students, searchTerm])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Assigned Students</h1>
          <p className="text-gray-500 mt-1">Students currently assigned to you for internship supervision.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm text-primary-700 font-medium">
          <Users size={16} />
          Total: {students.length}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Search by name, email, school, department or program..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="table-header text-left">Name</th>
                <th className="table-header text-left">Email</th>
                <th className="table-header text-left">School</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Program</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-cell py-12 text-center text-gray-500">
                    Loading assigned students...
                  </td>
                </tr>
              ) : null}

              {!loading && error ? (
                <tr>
                  <td colSpan={5} className="table-cell py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : null}

              {!loading && !error && filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell py-12 text-center text-gray-500">
                    No assigned students match your search.
                  </td>
                </tr>
              ) : null}

              {!loading && !error && filteredStudents.map((student, index) => (
                <tr key={student.id || `${student.sch_email}-${index}`} className={index % 2 ? 'bg-gray-50/30' : ''}>
                  <td className="table-cell font-medium text-gray-900">{formatName(student)}</td>
                  <td className="table-cell text-gray-700">{student.sch_email || '-'}</td>
                  <td className="table-cell text-gray-700">{student.institution_name || '-'}</td>
                  <td className="table-cell text-gray-700">{student.department || '-'}</td>
                  <td className="table-cell text-gray-700">{student.programme || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}