const PROFILE_STORAGE_KEY = 'academicIQ_profile'
const INTERNSHIP_STORAGE_KEY = 'academicIQ_internship'
const APPRAISALS_STORAGE_KEY = 'academicIQ_appraisals'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function saveProfile(profile) {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function clearProfile() {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(PROFILE_STORAGE_KEY)
}

export function getStoredProfile() {
  const storage = getStorage()
  if (!storage) return null
  const raw = storage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveInternship(data) {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(INTERNSHIP_STORAGE_KEY, JSON.stringify(data))
}

export function getStoredInternship() {
  const storage = getStorage()
  if (!storage) return null
  const raw = storage.getItem(INTERNSHIP_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAppraisal(appraisal) {
  const storage = getStorage()
  if (!storage) return []

  const existing = getStoredAppraisals()
  const next = [...existing, appraisal]
  storage.setItem(APPRAISALS_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getStoredAppraisals() {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(APPRAISALS_STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
