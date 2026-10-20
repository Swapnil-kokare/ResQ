import React, { useState } from 'react'
import { Clock, Moon, Sun, School, Calendar, Settings2, Plus, Trash2 } from 'lucide-react'
import type { DailyRoutine, PlanningSettings, FixedCommitment } from '../types'

interface RoutineConstraintManagerProps {
  routine: DailyRoutine
  settings: PlanningSettings
  fixedCommitments: FixedCommitment[]
  onUpdateRoutine: (routine: DailyRoutine) => void
  onUpdateSettings: (settings: PlanningSettings) => void
  onAddFixedCommitment: (commitment: FixedCommitment) => void
  onRemoveFixedCommitment: (id: string) => void
}

export const RoutineConstraintManager: React.FC<RoutineConstraintManagerProps> = ({
  routine,
  settings,
  fixedCommitments,
  onUpdateRoutine,
  onUpdateSettings,
  onAddFixedCommitment,
  onRemoveFixedCommitment
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [newCommitmentName, setNewCommitmentName] = useState('')
  const [newCommitmentStart, setNewCommitmentStart] = useState('2026-10-21T16:00:00')
  const [newCommitmentEnd, setNewCommitmentEnd] = useState('2026-10-21T18:00:00')

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommitmentName.trim()) return

    onAddFixedCommitment({
      id: `fc_${Date.now()}`,
      name: newCommitmentName.trim(),
      category: 'other',
      start_time: newCommitmentStart,
      end_time: newCommitmentEnd
    })
    setNewCommitmentName('')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            Daily Routine and Fixed Hard Constraints
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            College hours, sleep, meal intervals, slot duration, and exam timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
        >
          {isOpen ? 'Collapse Details' : 'Configure Constraints'}
        </button>
      </div>

      {/* Routine Quick Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Window</span>
          </div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {routine.wake_time} – {routine.sleep_time}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <School className="w-3.5 h-3.5 text-blue-500" />
            <span>College Days</span>
          </div>
          <div className="font-semibold text-slate-900 mt-0.5">
            Days {routine.college_days.join(', ')} ({routine.college_start}–{routine.college_end})
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Slot Granularity</span>
          </div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {settings.slot_duration_minutes} min slots (max {settings.max_chunk_hours}h block)
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Exam Date</span>
          </div>
          <div className="font-semibold text-slate-900 mt-0.5 truncate">
            {new Date(settings.exam_datetime).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Collapsible In-Depth Editor */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Waking & Sleeping */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-600" /> Sleep Schedule
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={routine.wake_time}
                    onChange={(e) => onUpdateRoutine({ ...routine, wake_time: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">Sleep Time</label>
                  <input
                    type="time"
                    value={routine.sleep_time}
                    onChange={(e) => onUpdateRoutine({ ...routine, sleep_time: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            {/* College Lecture Commitments */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-600" /> College Lectures
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={routine.college_start}
                    onChange={(e) => onUpdateRoutine({ ...routine, college_start: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">End Time</label>
                  <input
                    type="time"
                    value={routine.college_end}
                    onChange={(e) => onUpdateRoutine({ ...routine, college_end: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Slot Size and Horizon */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-emerald-600" /> Engine Settings
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">Slot Size</label>
                  <select
                    value={settings.slot_duration_minutes}
                    onChange={(e) => onUpdateSettings({ ...settings, slot_duration_minutes: parseInt(e.target.value, 10) })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  >
                    <option value="60">60 mins (Default)</option>
                    <option value="30">30 mins (Fine)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium text-[11px] block mb-1">Max Block</label>
                  <select
                    value={settings.max_chunk_hours}
                    onChange={(e) => onUpdateSettings({ ...settings, max_chunk_hours: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                  >
                    <option value="1.5">1.5 hours</option>
                    <option value="2.0">2.0 hours</option>
                    <option value="3.0">3.0 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fixed Commitments Form & List */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Additional Fixed Commitments (Doctor, Lab, Travel)</h4>
            <form onSubmit={handleAddCommitment} className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Commitment description"
                value={newCommitmentName}
                onChange={(e) => setNewCommitmentName(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded flex-1 min-w-[160px]"
              />
              <input
                type="datetime-local"
                value={newCommitmentStart.slice(0, 16)}
                onChange={(e) => setNewCommitmentStart(`${e.target.value}:00`)}
                className="text-xs px-2 py-1 border border-slate-300 rounded"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="datetime-local"
                value={newCommitmentEnd.slice(0, 16)}
                onChange={(e) => setNewCommitmentEnd(`${e.target.value}:00`)}
                className="text-xs px-2 py-1 border border-slate-300 rounded"
              />
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Block Time
              </button>
            </form>

            {fixedCommitments.filter((fc) => fc.category !== 'exam').length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fixedCommitments.filter((fc) => fc.category !== 'exam').map((fc) => (
                  <span
                    key={fc.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs border border-slate-200 font-medium"
                  >
                    {fc.name} ({new Date(fc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(fc.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    <button
                      type="button"
                      onClick={() => onRemoveFixedCommitment(fc.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
