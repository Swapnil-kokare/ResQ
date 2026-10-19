import React, { useState } from 'react'
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  Circle,
  Download,
  Play,
  RotateCw,
  BookOpen,
  Sparkles,
  Coffee,
  School
} from 'lucide-react'
import type { StudySession } from '../types'

interface TimetableGridProps {
  sessions: StudySession[]
  numDays: number
  startDate: string
  isLoading: boolean
  hasSchedule: boolean
  onGenerate: () => void
  onReplan: () => void
  onToggleLock: (id: string) => void
  onToggleCompleteSession: (id: string) => void
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  sessions,
  numDays,
  startDate,
  isLoading,
  hasSchedule,
  onGenerate,
  onReplan,
  onToggleLock,
  onToggleCompleteSession
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all')

  // CSV Export functionality
  const handleExportCSV = () => {
    if (!sessions || sessions.length === 0) return

    const headers = ['Day', 'Date', 'Start Time', 'End Time', 'Duration (Hours)', 'Type', 'Subject', 'Session Title', 'Completed', 'Locked']
    const rows = sessions.map((s) => {
      const sDate = new Date(s.start_time).toLocaleDateString()
      const sStart = new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const sEnd = new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return [
        `Day ${s.day_index}`,
        sDate,
        sStart,
        sEnd,
        s.duration_hours,
        s.session_type,
        `"${s.subject.replace(/"/g, '""')}"`,
        `"${s.title.replace(/"/g, '""')}"`,
        s.completed ? 'YES' : 'NO',
        s.is_locked ? 'YES' : 'NO'
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ResQ_Study_Timetable_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group sessions by day index
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1)
  const filteredSessions = selectedDay === 'all'
    ? sessions
    : sessions.filter((s) => s.day_index === selectedDay)

  const getSessionTypeStyle = (type: string, isLocked: boolean) => {
    switch (type) {
      case 'study':
        return {
          bg: isLocked ? 'bg-indigo-50 border-indigo-300' : 'bg-blue-50/70 border-blue-200',
          accent: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
          icon: BookOpen
        }
      case 'revision':
        return {
          bg: 'bg-purple-50/80 border-purple-200',
          accent: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800',
          icon: Sparkles
        }
      case 'break':
        return {
          bg: 'bg-emerald-50/50 border-emerald-200 text-slate-700',
          accent: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: Coffee
        }
      case 'fixed':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-500',
          accent: 'text-slate-600',
          badge: 'bg-slate-200/80 text-slate-700',
          icon: School
        }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Day-Wise Study Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Color-coded timetable distinguishing study chunks, mandatory revisions, and fixed routines.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isLoading ? 'Solving CSP...' : 'Generate Plan'}</span>
          </button>

          <button
            type="button"
            onClick={onReplan}
            disabled={isLoading || !hasSchedule}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
            title="Preserves locked sessions and replans remaining topics"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Replan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!hasSchedule || sessions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
            title="Export generated timetable to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 mb-4 text-xs">
        <button
          type="button"
          onClick={() => setSelectedDay('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
            selectedDay === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Days ({numDays} Days)
        </button>

        {daysArray.map((dayNum) => {
          const dayDate = new Date(startDate)
          dayDate.setDate(dayDate.getDate() + dayNum - 1)
          const dateStr = dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                selectedDay === dayNum
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Day {dayNum} ({dateStr})
            </button>
          )
        })}
      </div>

      {/* Timetable Session Cards */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Timetable Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Click "Generate Plan" or pick one of the demonstration scenarios above to solve your conflict-free schedule.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Generate Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSessions.map((session) => {
            const style = getSessionTypeStyle(session.session_type, session.is_locked)
            const Icon = style.icon
            const startTimeStr = new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const endTimeStr = new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={session.id}
                className={`relative rounded-lg border p-3.5 transition-all shadow-2xs ${style.bg} ${
                  session.completed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-md bg-white border border-slate-200 shadow-2xs ${style.accent}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.badge}`}>
                        {session.session_type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 ml-1.5">
                        Day {session.day_index}
                      </span>
                    </div>
                  </div>

                  {/* Actions for study / revision sessions */}
                  {session.session_type !== 'fixed' && session.session_type !== 'break' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleLock(session.id)}
                        className={`p-1 rounded hover:bg-white/80 transition-colors ${
                          session.is_locked ? 'text-indigo-600 font-bold' : 'text-slate-400'
                        }`}
                        title={session.is_locked ? 'Locked session (fixed during replan)' : 'Click to lock in slot'}
                      >
                        {session.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleCompleteSession(session.id)}
                        className="p-1 rounded hover:bg-white/80 text-slate-400 hover:text-emerald-600 transition-colors"
                        title={session.completed ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {session.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2.5">
                  <h4 className={`text-xs font-bold text-slate-900 m-0 ${session.completed ? 'line-through text-slate-500' : ''}`}>
                    {session.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {session.subject}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>{startTimeStr} – {endTimeStr}</span>
                  <span className="font-semibold text-slate-800">{session.duration_hours} hr{session.duration_hours === 1 ? '' : 's'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
