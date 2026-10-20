import type {
  ScheduleRequest,
  ScheduleResponse,
  ReplanRequest,
  ValidateRequest,
  ValidationResult,
  DemoScenario
} from '../types'

const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '')
  }
  // Default to relative /api in production (reverse proxy/Vercel rewrite) or localhost in dev
  return import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api'
}

const API_BASE = getApiBase()

async function safeFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, options)
    if (res.ok) return res
    // If not ok and we used an absolute URL, try relative /api as fallback
    if (API_BASE.startsWith('http')) {
      const fallbackRes = await fetch(`/api${cleanEndpoint}`, options)
      if (fallbackRes.ok) return fallbackRes
    }
    return res
  } catch (err) {
    // If network error occurred with absolute URL, fallback to relative /api
    if (API_BASE.startsWith('http')) {
      return await fetch(`/api${cleanEndpoint}`, options)
    }
    throw err
  }
}

export async function checkHealth(): Promise<{ status: string; algorithm: string }> {
  const res = await safeFetch('/health')
  if (!res.ok) throw new Error('Health check failed')
  return await res.json()
}

export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  const res = await safeFetch('/demo/scenarios')
  if (!res.ok) throw new Error('Failed to load scenarios')
  return await res.json()
}

export async function generateSchedule(req: ScheduleRequest): Promise<ScheduleResponse> {
  const res = await safeFetch('/schedule/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Schedule generation failed: ${errorText}`)
  }
  return await res.json()
}

export async function replanSchedule(req: ReplanRequest): Promise<ScheduleResponse> {
  const res = await safeFetch('/schedule/replan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Schedule replanning failed: ${errorText}`)
  }
  return await res.json()
}

export async function validateSchedule(req: ValidateRequest): Promise<ValidationResult> {
  const res = await safeFetch('/schedule/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Validation check failed: ${errorText}`)
  }
  return await res.json()
}
