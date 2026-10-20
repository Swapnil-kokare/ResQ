import React, { useState, useEffect } from 'react'
import {
  checkHealth,
  fetchDemoScenarios,
  generateSchedule,
  replanSchedule
} from './services/api'
import type {
  Topic,
  DailyRoutine,
  PlanningSettings,
  FixedCommitment,
  ScheduleResponse,
  DemoScenario
} from './types'
import { Header } from './components/Header'
import { ScenarioDemoBar } from './components/ScenarioDemoBar'
import { DashboardStats } from './components/DashboardStats'
import { TaskSubjectManager } from './components/TaskSubjectManager'
import { RoutineConstraintManager } from './components/RoutineConstraintManager'
import { TimetableGrid } from './components/TimetableGrid'
import { InfeasibilityAlert } from './components/InfeasibilityAlert'
import { AlgorithmActivityPanel } from './components/AlgorithmActivityPanel'
import {
  Calendar,
  BookOpen,
  LayoutGrid,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock
} from 'lucide-react'

type ScreenId = 'setup' | 'subjects' | 'timetable' | 'telemetry'

interface ScreenConfig {
  id: ScreenId
  step: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

const SCREENS: ScreenConfig[] = [
  {
    id: 'setup',
    step: '1',
    title: 'Exam & Routine',
    subtitle: 'Daily routine & exam date',
    icon: Calendar
  },
  {
    id: 'subjects',
    step: '2',
    title: 'Subjects & Proficiency',
    subtitle: 'Knowledge levels & topics',
    icon: BookOpen
  },
  {
    id: 'timetable',
    step: '3',
    title: 'Interactive Timetable',
    subtitle: 'Drag & drop schedule planner',
    icon: LayoutGrid
  },
  {
    id: 'telemetry',
    step: '4',
    title: 'AI CSP Activity',
    subtitle: 'Backtracking trace & heuristics',
    icon: Cpu
  }
]

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('setup')
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null)
  const [scenarios, setScenarios] = useState<DemoScenario[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('feasible')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Core problem state
  const [topics, setTopics] = useState<Topic[]>([])
  const [routine, setRoutine] = useState<DailyRoutine>({
    wake_time: '07:00',
    sleep_time: '22:30',
    college_days: [1, 2],
    college_start: '08:00',
    college_end: '14:00',
    meals: [
      { name: 'Lunch', start_time: '13:00', end_time: '14:00' },
      { name: 'Dinner', start_time: '20:00', end_time: '21:00' }
    ],
    min_break_minutes: 15
  })
  const [settings, setSettings] = useState<PlanningSettings>({
    start_date: '2026-10-20',
    num_days: 4,
    slot_duration_minutes: 60,
    max_chunk_hours: 2.0,
    min_chunk_hours: 1.0,
    exam_datetime: '2026-10-23T09:00:00',
    max_backtracks: 5000,
    search_timeout_seconds: 5.0
  })
  const [fixedCommitments, setFixedCommitments] = useState<FixedCommitment[]>([])

  // Solver output state
  const [scheduleResponse, setScheduleResponse] = useState<ScheduleResponse | null>(null)

  // Initialize and check health
  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth()
        setIsBackendHealthy(health.status === 'healthy')
      } catch {
        setIsBackendHealthy(false)
      }

      try {
        const loadedScenarios = await fetchDemoScenarios()
        setScenarios(loadedScenarios)

        // Default to Feasible Plan scenario
        if (loadedScenarios.length > 0) {
          const defaultScenario = loadedScenarios[0]
          loadScenario(defaultScenario)
        }
      } catch (err) {
        console.error('Failed to load demo scenarios', err)
      }
    }
    init()
  }, [])

  const loadScenario = async (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id)
    setTopics(scenario.request.topics)
    setRoutine(scenario.request.routine)
    setSettings(scenario.request.settings)
    setFixedCommitments(scenario.request.fixed_commitments)

    // Run solver automatically
    await triggerSolve(
      scenario.request.topics,
      scenario.request.routine,
      scenario.request.settings,
      scenario.request.fixed_commitments
    )
  }

  const triggerSolve = async (
    curTopics = topics,
    curRoutine = routine,
    curSettings = settings,
    curFixed = fixedCommitments,
    autoNavigate = false
  ) => {
    setIsLoading(true)
    try {
      const response = await generateSchedule({
        topics: curTopics,
        routine: curRoutine,
        settings: curSettings,
        fixed_commitments: curFixed
      })
      setScheduleResponse(response)
      if (autoNavigate) {
        setCurrentScreen('timetable')
      }
    } catch (err) {
      console.error('Solve error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = () => {
    triggerSolve(topics, routine, settings, fixedCommitments, false)
  }

  const handleSolveAndNavigate = () => {
    triggerSolve(topics, routine, settings, fixedCommitments, true)
  }

  const handleReplan = async () => {
    if (!scheduleResponse) return
    setIsLoading(true)
    try {
      // Find locked sessions
      const locked = scheduleResponse.sessions.filter((s) => s.is_locked)
      const res = await replanSchedule({
        topics,
        routine,
        settings,
        fixed_commitments: fixedCommitments,
        locked_sessions: locked
      })
      setScheduleResponse(res)
    } catch (err) {
      console.error('Replan error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Drag and drop / Manual day mover session update
  const handleMoveSession = (sessionId: string, targetDay: number) => {
    if (!scheduleResponse) return
    const session = scheduleResponse.sessions.find((s) => s.id === sessionId)
    if (!session || session.day_index === targetDay) return

    const dayDiff = targetDay - session.day_index
    const newStart = new Date(session.start_time)
    const newEnd = new Date(session.end_time)
    newStart.setDate(newStart.getDate() + dayDiff)
    newEnd.setDate(newEnd.getDate() + dayDiff)

    const updatedSessions = scheduleResponse.sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          day_index: targetDay,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          is_locked: true // Lock moved session so Replan respects manual placement
        }
      }
      return s
    })

    setScheduleResponse({
      ...scheduleResponse,
      sessions: updatedSessions
    })
  }

  // Toggle locked status on a study session
  const handleToggleLock = (sessionId: string) => {
    if (!scheduleResponse) return
    const updated = scheduleResponse.sessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, is_locked: !s.is_locked }
      }
      return s
    })
    setScheduleResponse({
      ...scheduleResponse,
      sessions: updated
    })
  }

  // Toggle completed status on a session
  const handleToggleCompleteSession = (sessionId: string) => {
    if (!scheduleResponse) return
    const updated = scheduleResponse.sessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, completed: !s.completed }
      }
      return s
    })
    setScheduleResponse({
      ...scheduleResponse,
      sessions: updated
    })
  }

  // Topic CRUD
  const handleAddTopic = (topic: Topic) => {
    setTopics([...topics, topic])
    setActiveScenarioId(null)
  }

  const handleUpdateTopic = (updated: Topic) => {
    setTopics(topics.map((t) => (t.id === updated.id ? updated : t)))
    setActiveScenarioId(null)
  }

  const handleDeleteTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id))
    setActiveScenarioId(null)
  }

  const handleToggleCompleteTopic = (id: string) => {
    setTopics(
      topics.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  // Fixed Commitment actions
  const handleAddFixedCommitment = (fc: FixedCommitment) => {
    setFixedCommitments([...fixedCommitments, fc])
    setActiveScenarioId(null)
  }

  const handleRemoveFixedCommitment = (id: string) => {
    setFixedCommitments(fixedCommitments.filter((fc) => fc.id !== id))
    setActiveScenarioId(null)
  }

  const handleReset = () => {
    if (scenarios.length > 0) {
      loadScenario(scenarios[0])
    }
  }

  const totalRequiredHours = Number(
    topics.filter((t) => !t.completed).reduce((acc, t) => acc + t.duration_hours, 0).toFixed(1)
  )

  // Countdown string
  const getExamCountdown = () => {
    try {
      const examTime = new Date(settings.exam_datetime).getTime()
      const now = new Date('2026-10-20T08:00:00').getTime()
      const diff = examTime - now
      if (diff <= 0) return 'Exam In Progress'
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${days}d ${hours}h remaining`
    } catch {
      return 'Target deadline set'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        isBackendHealthy={isBackendHealthy}
        lastSolvingTimeMs={scheduleResponse?.stats?.elapsed_time_ms}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Multi-Screen Navigation Stepper Header */}
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Planning Workflow</span>
              <span className="text-xs text-slate-300">&bull;</span>
              <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Exam: {getExamCountdown()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Topics: <strong className="text-slate-800">{topics.length}</strong> | Required: <strong className="text-slate-800">{totalRequiredHours}h</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-2">
            {SCREENS.map((sc) => {
              const Icon = sc.icon
              const isActive = currentScreen === sc.id
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setCurrentScreen(sc.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {sc.title}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {sc.subtitle}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SCREEN 1: Exam & Routine Setup */}
        {currentScreen === 'setup' && (
          <div className="space-y-6">
            {/* Quick Demo Scenarios Bar */}
            <ScenarioDemoBar
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              isLoading={isLoading}
              onSelectScenario={loadScenario}
              onReset={handleReset}
            />

            {/* Routine & Hard Constraints Form */}
            <RoutineConstraintManager
              routine={routine}
              settings={settings}
              fixedCommitments={fixedCommitments}
              onUpdateRoutine={(r) => { setRoutine(r); setActiveScenarioId(null) }}
              onUpdateSettings={(s) => { setSettings(s); setActiveScenarioId(null) }}
              onAddFixedCommitment={handleAddFixedCommitment}
              onRemoveFixedCommitment={handleRemoveFixedCommitment}
            />

            {/* Bottom Screen Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Step 1 of 4 &bull; Adjust routine hours and college commitments
              </span>
              <button
                type="button"
                onClick={() => setCurrentScreen('subjects')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Continue to Subjects & Proficiency</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: Subjects & Proficiency Assessment */}
        {currentScreen === 'subjects' && (
          <div className="space-y-6">
            {/* Task and Subject Manager with Dynamic Proficiency */}
            <TaskSubjectManager
              topics={topics}
              onAddTopic={handleAddTopic}
              onUpdateTopic={handleUpdateTopic}
              onDeleteTopic={handleDeleteTopic}
              onToggleComplete={handleToggleCompleteTopic}
            />

            {/* Bottom Screen Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentScreen('setup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Routine Setup</span>
              </button>

              <button
                type="button"
                onClick={handleSolveAndNavigate}
                disabled={isLoading || topics.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Solving CSP...' : 'Solve & View Timetable'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: Interactive Timetable & Drag-and-Drop */}
        {currentScreen === 'timetable' && (
          <div className="space-y-6">
            {/* Top Analytics & Feasibility Stats */}
            <DashboardStats
              examDatetime={settings.exam_datetime}
              totalTopics={topics.length}
              totalRequiredHours={totalRequiredHours}
              availableStudyHours={scheduleResponse?.available_study_hours || 28.5}
              scheduleResponse={scheduleResponse}
              isLoading={isLoading}
            />

            {/* Honest Infeasibility Alert if overconstrained */}
            {scheduleResponse && !scheduleResponse.success && (
              <InfeasibilityAlert scheduleResponse={scheduleResponse} />
            )}

            {/* Drag and Drop Timetable Grid */}
            <TimetableGrid
              sessions={scheduleResponse?.sessions || []}
              numDays={settings.num_days}
              startDate={settings.start_date}
              isLoading={isLoading}
              hasSchedule={scheduleResponse !== null}
              onGenerate={handleGenerate}
              onReplan={handleReplan}
              onToggleLock={handleToggleLock}
              onToggleCompleteSession={handleToggleCompleteSession}
              onMoveSession={handleMoveSession}
            />

            {/* Bottom Screen Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentScreen('subjects')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modify Subjects & Proficiency</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('telemetry')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>Inspect AI CSP Activity</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: AI CSP Solver Activity & Telemetry */}
        {currentScreen === 'telemetry' && (
          <div className="space-y-6">
            {/* Algorithm Heuristic Explainer Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h3>How ResQ's CSP Solver Operates</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                ResQ models deadline study scheduling as a formal <strong>Constraint Satisfaction Problem (CSP)</strong>.
                Variables represent topic chunks and follow-up revisions; domains represent conflict-free discrete time slots across the horizon.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                  <div className="font-bold text-blue-900 mb-1">1. MRV Heuristic</div>
                  <p className="text-blue-700 text-[11px]">
                    <strong>Minimum Remaining Values:</strong> Variables with the fewest candidate slots (due to early deadlines or tight proficiency constraints) are chosen first to minimize search branching.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
                  <div className="font-bold text-indigo-900 mb-1">2. Forward Checking</div>
                  <p className="text-indigo-700 text-[11px]">
                    Whenever a session is placed, invalid overlapping candidate slots in all remaining unassigned variables are pruned immediately to detect dead ends before wasting computation.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200">
                  <div className="font-bold text-purple-900 mb-1">3. Proficiency Adaptation</div>
                  <p className="text-purple-700 text-[11px]">
                    Beginner subjects receive priority boosts and mandatory revision chunks, placed in high-alert morning/afternoon study blocks for optimal retention.
                  </p>
                </div>
              </div>
            </div>

            {/* Live CSP Solver Activity Panel */}
            <AlgorithmActivityPanel
              events={scheduleResponse?.events || []}
              stats={scheduleResponse?.stats}
            />

            {/* Bottom Screen Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentScreen('timetable')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Timetable Planner</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('setup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Configure New Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>ResQ — AI Study Planner for Deadlines &bull; Constraint Satisfaction Problem with Backtracking, MRV & Forward Checking</p>
      </footer>
    </div>
  )
}

export default App
