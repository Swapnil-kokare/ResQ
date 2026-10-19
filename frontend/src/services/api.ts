import type {
  ScheduleRequest,
  ScheduleResponse,
  ReplanRequest,
  ValidateRequest,
  ValidationResult,
  DemoScenario
} from '../types'

const API_BASE = 'http://127.0.0.1:8000/api'

export async function checkHealth(): Promise<{ status: string; algorithm: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) throw new Error('Health check failed')
    return await res.json()
  } catch (err) {
    const res = await fetch('/api/health')
    return await res.json()
  }
}

export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  try {
    const res = await fetch(`${API_BASE}/demo/scenarios`)
    if (!res.ok) throw new Error('Failed to load scenarios')
    return await res.json()
  } catch (err) {
    const res = await fetch('/api/demo/scenarios')
    return await res.json()
  }
}

export async function generateSchedule(req: ScheduleRequest): Promise<ScheduleResponse> {
  const res = await fetch(`${API_BASE}/schedule/generate`, {
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
  const res = await fetch(`${API_BASE}/schedule/replan`, {
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
  const res = await fetch(`${API_BASE}/schedule/validate`, {
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
