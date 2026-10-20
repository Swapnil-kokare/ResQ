export type SessionType = 'study' | 'revision' | 'break' | 'fixed' | 'exam'

export interface CollegeExamPaper {
  id: string
  subject: string
  paper_title: string
  exam_date: string
  duration_hours: number
  venue?: string
}

export interface MealInterval {
  name: string
  start_time: string
  end_time: string
}

export interface StudyWindow {
  start_time: string
  end_time: string
  preference_weight: number
}

export interface Topic {
  id: string
  name: string
  subject: string
  duration_hours: number
  priority: number
  deadline: string
  proficiency?: 'beginner' | 'intermediate' | 'advanced'
  exam_date?: string
  is_revision?: boolean
  requires_revision?: boolean
  completed?: boolean
  color?: string
}

export interface FixedCommitment {
  id: string
  name: string
  category: 'college' | 'meal' | 'sleep' | 'exam' | 'break' | 'other'
  start_time: string
  end_time: string
  day_index?: number
}

export interface DailyRoutine {
  wake_time: string
  sleep_time: string
  college_days: number[]
  college_start: string
  college_end: string
  meals: MealInterval[]
  preferred_study_windows?: StudyWindow[]
  min_break_minutes: number
}

export interface PlanningSettings {
  start_date: string
  num_days: number
  slot_duration_minutes: number
  max_chunk_hours: number
  min_chunk_hours: number
  exam_datetime: string
  max_backtracks: number
  search_timeout_seconds: number
}

export interface StudySession {
  id: string
  topic_id?: string
  subject: string
  title: string
  start_time: string
  end_time: string
  day_index: number
  duration_hours: number
  session_type: SessionType
  is_locked: boolean
  completed: boolean
  color?: string
}

export type EventType =
  | 'variable_selected'
  | 'slot_considered'
  | 'constraint_violated'
  | 'backtrack'
  | 'assignment_accepted'
  | 'solution_found'
  | 'infeasible'
  | 'search_limit'

export interface SolverEvent {
  step: number
  event_type: EventType
  variable_name?: string
  slot_description?: string
  reason?: string
  timestamp_ms: number
}

export interface SolverStats {
  total_variables: number
  assignments_attempted: number
  backtracks: number
  elapsed_time_ms: number
  search_limit_reached: boolean
  status: 'FEASIBLE' | 'INFEASIBLE' | 'SEARCH_LIMIT_REACHED'
}

export interface ScheduleRequest {
  topics: Topic[]
  fixed_commitments: FixedCommitment[]
  routine: DailyRoutine
  settings: PlanningSettings
}

export interface ScheduleResponse {
  success: boolean
  status: 'FEASIBLE' | 'INFEASIBLE' | 'SEARCH_LIMIT_REACHED'
  sessions: StudySession[]
  stats: SolverStats
  events: SolverEvent[]
  total_required_hours: number
  total_scheduled_hours: number
  available_study_hours: number
  unscheduled_topics: string[]
  infeasibility_reason?: string
  bottleneck_analysis?: string
  suggestions: string[]
}

export interface ReplanRequest {
  topics: Topic[]
  fixed_commitments: FixedCommitment[]
  routine: DailyRoutine
  settings: PlanningSettings
  locked_sessions: StudySession[]
}

export interface ValidateRequest {
  sessions: StudySession[]
  topics: Topic[]
  fixed_commitments: FixedCommitment[]
  settings: PlanningSettings
}

export interface ValidationResult {
  is_valid: boolean
  hard_constraint_violations: number
  violations: string[]
  warnings: string[]
  details: Record<string, unknown>
}

export interface DemoScenario {
  id: string
  name: string
  description: string
  badge: string
  request: ScheduleRequest
}
