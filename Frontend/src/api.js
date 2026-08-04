const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function buildBasicAuthHeader(username, password) {
  if (!username || !password) return {}
  const token = typeof window !== 'undefined' && window.btoa
    ? window.btoa(`${username}:${password}`)
    : Buffer.from(`${username}:${password}`).toString('base64')
  return { Authorization: `Basic ${token}` }
}

export async function apiRequest(path, { method = 'GET', body, auth, headers = {}, parseJson = true, expectBlob = false } = {}) {
  const requestHeaders = { ...headers }
  let payload = body

  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  if (auth?.username && auth?.password) {
    Object.assign(requestHeaders, buildBasicAuthHeader(auth.username, auth.password))
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
      credentials: 'include',
    })
  } catch (error) {
    throw new Error('Unable to reach the server. Please make sure the backend is running and try again.')
  }

  if (!response.ok) {
    let errorData = null
    try {
      errorData = await response.json()
    } catch {
      errorData = null
    }

    const message = errorData && typeof errorData === 'object'
      ? JSON.stringify(errorData)
      : errorData?.detail || errorData?.error || `Request failed with status ${response.status}`

    throw new Error(message)
  }

  if (expectBlob) return response.blob()
  if (parseJson) {
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }
  return response.text()
}

export function registerUser(payload) {
  return apiRequest('/auth/register/', { method: 'POST', body: payload })
}

export function loginUser(credentials) {
  return apiRequest('/auth/login/', { method: 'POST', body: credentials })
}

export function changePassword(payload) {
  return apiRequest('/auth/change-password/', { method: 'POST', body: payload })
}

export function getStudentProfile() {
  return apiRequest('/student/profile/')
}

export function updateStudentProfile(payload) {
  return apiRequest('/student/profile/', { method: 'PATCH', body: payload })
}

export function getStudentInternships() {
  return apiRequest('/student/internships/')
}

export function createStudentInternship(payload) {
  return apiRequest('/student/internships/', { method: 'POST', body: payload })
}

export function getStudentDashboardSummary() {
  return apiRequest('/student/dashboard/')
}

export function getStudentReports() {
  return apiRequest('/student/reports/')
}

export function getStudentLogs() {
  return apiRequest('/student/logs/')
}

export function createStudentLog(payload) {
  return apiRequest('/student/logs/', { method: 'POST', body: payload })
}

export function updateStudentLog(logId, payload) {
  return apiRequest(`/student/logs/${logId}/`, { method: 'PATCH', body: payload })
}

export function saveReportDraft(payload) {
  return apiRequest('/student/report-draft/', { method: 'POST', body: payload })
}

export function generateStudentReport() {
  return apiRequest('/student/generate-report/', {
    method: 'POST',
    body: {},
    expectBlob: true,
    parseJson: false,
  })
}

export function getSupervisorStudents() {
  return apiRequest('/supervisor/students/')
}

export function getSupervisorLogs() {
  return apiRequest('/supervisor/logs/')
}

export function updateSupervisorLog(logId, payload) {
  return apiRequest(`/supervisor/logs/${logId}/`, { method: 'PATCH', body: payload })
}

export function bulkUpdateSupervisorLogs(payload) {
  return apiRequest('/supervisor/logs/bulk-status/', { method: 'POST', body: payload })
}
