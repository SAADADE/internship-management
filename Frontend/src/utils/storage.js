const PROFILE_STORAGE_KEY = 'academicIQ_profile'
const INTERNSHIP_STORAGE_KEY = 'academicIQ_internship'
const APPRAISALS_STORAGE_KEY = 'academicIQ_appraisals'
const CUSTOM_COMPANIES_STORAGE_KEY = 'academicIQ_custom_companies'

const DEFAULT_GHANA_COMPANIES = [
  'Ghana Revenue Authority',
  'MTN Ghana',
  'Vodafone Ghana',
  'Bank of Ghana',
  'Ghana Water Company',
  'Electricity Company of Ghana',
  'KPMG Ghana',
  'Ecobank Ghana',
  'Stanbic Bank Ghana',
  'Tullow Oil Ghana',
]

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

export function getCompanyOptions() {
  const storage = getStorage()
  if (!storage) return DEFAULT_GHANA_COMPANIES

  const raw = storage.getItem(CUSTOM_COMPANIES_STORAGE_KEY)
  const customCompanies = raw ? JSON.parse(raw) : []

  return [...DEFAULT_GHANA_COMPANIES, ...customCompanies].filter(Boolean)
}

export function saveCustomCompany(name) {
  const normalized = name?.trim()
  if (!normalized) return getCompanyOptions()

  const storage = getStorage()
  if (!storage) return getCompanyOptions()

  const existing = JSON.parse(storage.getItem(CUSTOM_COMPANIES_STORAGE_KEY) || '[]')
  const next = existing.includes(normalized) ? existing : [...existing, normalized]
  storage.setItem(CUSTOM_COMPANIES_STORAGE_KEY, JSON.stringify(next))
  return [...DEFAULT_GHANA_COMPANIES, ...next].filter(Boolean)
}
