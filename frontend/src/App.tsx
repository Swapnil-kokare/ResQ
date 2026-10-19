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

export const App: React.FC = () => {
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

    // Run solver automatically for instant presentation feedback
    await triggerSolve(scenario.request.topics, scenario.request.routine, scenario.request.settings, scenario.request.fixed_commitments)
  }

  const triggerSolve = async (
    curTopics = topics,
    curRoutine = routine,
    curSettings = settings,
    curFixed = fixedCommitments
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
    } catch (err) {
      console.error('Solve error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = () => {
    triggerSolve()
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
    setActiveScenarioId(null) // Custom problem
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        isBackendHealthy={isBackendHealthy}
        lastSolvingTimeMs={scheduleResponse?.stats?.elapsed_time_ms}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Scenario Demonstration Switcher */}
        <ScenarioDemoBar
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          isLoading={isLoading}
          onSelectScenario={loadScenario}
          onReset={handleReset}
        />

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

        {/* Timetable Grid & Actions */}
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
        />

        {/* Task & Subject Manager */}
        <TaskSubjectManager
          topics={topics}
          onAddTopic={handleAddTopic}
          onUpdateTopic={handleUpdateTopic}
          onDeleteTopic={handleDeleteTopic}
          onToggleComplete={handleToggleCompleteTopic}
        />

        {/* Routine and Hard Constraints */}
        <RoutineConstraintManager
          routine={routine}
          settings={settings}
          fixedCommitments={fixedCommitments}
          onUpdateRoutine={(r) => { setRoutine(r); setActiveScenarioId(null) }}
          onUpdateSettings={(s) => { setSettings(s); setActiveScenarioId(null) }}
          onAddFixedCommitment={handleAddFixedCommitment}
          onRemoveFixedCommitment={handleRemoveFixedCommitment}
        />

        {/* Live CSP Solver Activity Panel */}
        <AlgorithmActivityPanel
          events={scheduleResponse?.events || []}
          stats={scheduleResponse?.stats}
        />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>ResQ — AI Study Planner for Deadlines · Constraint Satisfaction Problem with Backtracking, MRV & Forward Checking</p>
      </footer>
    </div>
  )
}

export default App
