const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const API_BASE = RAW_API_BASE.replace(/\/+$/, '')

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value)
}

function getApiOrigin() {
  try {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return new URL(API_BASE, fallbackOrigin).origin
  } catch {
    return ''
  }
}

const API_ORIGIN = getApiOrigin()

if (import.meta.env.DEV) {
  // Helps verify which backend origin the frontend is targeting during local development.
  console.info('[api] base:', API_BASE, 'origin:', API_ORIGIN || '(unavailable)')
}

export function resolveApiUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`

  // Backend payloads can include /api/... links; attach only the origin to avoid /api/api duplication.
  if (normalizedPath.startsWith('/api/') && API_ORIGIN) {
    return `${API_ORIGIN}${normalizedPath}`
  }

  return `${API_BASE}${normalizedPath}`
}

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
    response = await fetch(resolveApiUrl(path), {
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

    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session is not active. Please log out and sign in again.')
    }

    const message = (() => {
      if (!errorData) return `Request failed with status ${response.status}`
      if (typeof errorData === 'string') return errorData
      if (errorData.detail) return errorData.detail
      if (errorData.error) return errorData.error
      if (Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length) {
        return errorData.non_field_errors[0]
      }
      return JSON.stringify(errorData)
    })()

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

export function getCurrentUserProfile() {
  return apiRequest('/auth/me/')
}

export function getNotifications() {
  return apiRequest('/notifications/')
}

export function getNotificationSummary() {
  return apiRequest('/notifications/summary/')
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read/`, { method: 'POST', body: {} })
}

export function markAllNotificationsRead() {
  return apiRequest('/notifications/mark-all-read/', { method: 'POST', body: {} })
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

export function updateStudentInternship(internshipId, payload) {
  return apiRequest(`/student/internships/${internshipId}/`, { method: 'PATCH', body: payload })
}

export function deleteStudentInternship(internshipId) {
  return apiRequest(`/student/internships/${internshipId}/`, { method: 'DELETE', parseJson: false })
}

export function getStudentCompanies() {
  return apiRequest('/student/companies/')
}

export function getStudentCompanyRequests() {
  return apiRequest('/student/company-requests/')
}

export function createStudentCompanyRequest(payload) {
  return apiRequest('/student/company-requests/', { method: 'POST', body: payload })
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

export function getStudentLog(logId) {
  return apiRequest(`/student/logs/${logId}/`)
}

export function deleteStudentLog(logId) {
  return apiRequest(`/student/logs/${logId}/`, { method: 'DELETE', parseJson: false })
}

export function saveReportDraft(payload) {
  return apiRequest('/student/report-draft/', { method: 'POST', body: payload })
}

export function generateStudentReport(payload = {}) {
  return apiRequest('/student/generate-report/', {
    method: 'POST',
    body: payload,
    expectBlob: true,
    parseJson: false,
  })
}

export function uploadStudentReportFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest('/student/reports/upload/', {
    method: 'POST',
    body: formData,
  })
}

export function getSupervisorStudents() {
  return apiRequest('/supervisor/students/')
}

export function getSupervisorAppraisalStudents() {
  return apiRequest('/supervisor/appraisal-students/')
}

export function getSupervisorAppraisals() {
  return apiRequest('/supervisor/appraisals/')
}

export function createSupervisorAppraisal(payload) {
  return apiRequest('/supervisor/appraisals/', { method: 'POST', body: payload })
}

export function updateSupervisorAppraisal(appraisalId, payload) {
  return apiRequest(`/supervisor/appraisals/${appraisalId}/`, { method: 'PATCH', body: payload })
}

export function deleteSupervisorAppraisal(appraisalId) {
  return apiRequest(`/supervisor/appraisals/${appraisalId}/`, { method: 'DELETE', parseJson: false })
}

export function getSupervisorLogs() {
  return apiRequest('/supervisor/logs/')
}

export function getSupervisorReports() {
  return apiRequest('/supervisor/reports/')
}

export function getSupervisorLog(logId) {
  return apiRequest(`/supervisor/logs/${logId}/`)
}

export function updateSupervisorLog(logId, payload) {
  return apiRequest(`/supervisor/logs/${logId}/`, { method: 'PATCH', body: payload })
}

export function bulkUpdateSupervisorLogs(payload) {
  return apiRequest('/supervisor/logs/bulk-status/', { method: 'POST', body: payload })
}

export function getAdminCompanies(search = '') {
  const query = search ? `?q=${encodeURIComponent(search)}` : ''
  return apiRequest(`/admin/companies/${query}`)
}

export function createAdminCompany(payload) {
  return apiRequest('/admin/companies/', { method: 'POST', body: payload })
}

export function updateAdminCompany(companyId, payload) {
  return apiRequest(`/admin/companies/${companyId}/`, { method: 'PATCH', body: payload })
}

export function deleteAdminCompany(companyId) {
  return apiRequest(`/admin/companies/${companyId}/`, { method: 'DELETE', parseJson: false })
}

export function getAdminCompanyRequests(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiRequest(`/admin/company-requests/${query}`)
}

export function reviewAdminCompanyRequest(requestId, payload) {
  return apiRequest(`/admin/company-requests/${requestId}/`, { method: 'PATCH', body: payload })
}

export function getAdminDashboard() {
  return apiRequest('/admin/dashboard/')
}

export function getAdminStudents() {
  return apiRequest('/admin/students/')
}

export function getAdminStudentDetail(studentId) {
  return apiRequest(`/admin/students/${studentId}/`)
}

export function getAdminReportsIndex() {
  return apiRequest('/admin/reports/')
}

export function getAdminReportDetail(reportId) {
  return apiRequest(`/admin/reports/${reportId}/`)
}

export function updateAdminReportDetail(reportId, payload) {
  return apiRequest(`/admin/reports/${reportId}/`, { method: 'PATCH', body: payload })
}

export function getAdminAppraisalDetail(appraisalId) {
  return apiRequest(`/admin/appraisals/${appraisalId}/`)
}

export function getAdminReportDownloadUrl(reportId) {
  return resolveApiUrl(`/admin/reports/${reportId}/download/`)
}

export function downloadAdminReportFile(reportId) {
  return apiRequest(`/admin/reports/${reportId}/download/`, {
    expectBlob: true,
    parseJson: false,
  })
}
