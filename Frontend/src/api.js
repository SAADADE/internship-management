const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function buildBasicAuthHeader(username, password) {
  if (!username || !password) return {}
  const token = typeof window !== 'undefined' && window.btoa
    ? window.btoa(`${username}:${password}`)
    : Buffer.from(`${username}:${password}`).toString('base64')
  return { Authorization: `Basic ${token}` }
}

function getErrorMessage(response, fallback) {
  if (!response) return fallback
  return fallback
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

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: payload,
    credentials: 'include',
  })

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
