import React, { useState } from 'react'
import { Plus, Trash2, CheckSquare, Square, AlertCircle, Bookmark } from 'lucide-react'
import type { Topic } from '../types'

interface TaskSubjectManagerProps {
  topics: Topic[]
  onAddTopic: (topic: Topic) => void
  onUpdateTopic: (topic: Topic) => void
  onDeleteTopic: (id: string) => void
  onToggleComplete: (id: string) => void
}

export const TaskSubjectManager: React.FC<TaskSubjectManagerProps> = ({
  topics,
  onAddTopic,
  onDeleteTopic,
  onToggleComplete
}) => {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('2.0')
  const [priority, setPriority] = useState('4')
  const [deadline, setDeadline] = useState('2026-10-22T22:00:00')
  const [requiresRevision, setRequiresRevision] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Topic name cannot be empty')
      return
    }
    if (!subject.trim()) {
      setError('Subject cannot be empty')
      return
    }
    const durNum = parseFloat(duration)
    if (isNaN(durNum) || durNum <= 0) {
      setError('Duration must be greater than 0 hours')
      return
    }

    const newTopic: Topic = {
      id: `topic_${Date.now()}`,
      name: name.trim(),
      subject: subject.trim(),
      duration_hours: durNum,
      priority: parseInt(priority, 10),
      deadline: deadline,
      requires_revision: requiresRevision,
      completed: false,
      color: '#3B82F6'
    }

    onAddTopic(newTopic)
    setName('')
    setError(null)
  }

  const getPriorityBadge = (p: number) => {
    switch (p) {
      case 5:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">P5 Urgent</span>
      case 4:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">P4 High</span>
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">P3 Medium</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">P{p} Normal</span>
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-600" />
            Task and Subject Manager
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure required topics, duration, priority weights, and revision requirements.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {topics.filter((t) => !t.completed).length} Active Topics
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAdd} className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Topic Name</label>
            <input
              type="text"
              placeholder="e.g. Calculus (Integration)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Priority (1-5)</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="5">5 - Critical (Urgent)</option>
              <option value="4">4 - High</option>
              <option value="3">3 - Medium</option>
              <option value="2">2 - Low</option>
              <option value="1">1 - Optional</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deadline Date/Time</label>
            <input
              type="datetime-local"
              value={deadline.slice(0, 16)}
              onChange={(e) => setDeadline(`${e.target.value}:00`)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={requiresRevision}
              onChange={(e) => setRequiresRevision(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="font-medium">Mandatory Revision Session (adds 1h follow-up before exam)</span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Topic
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Topic List Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 w-10 text-center">Status</th>
              <th className="px-3 py-2.5">Topic & Subject</th>
              <th className="px-3 py-2.5">Duration</th>
              <th className="px-3 py-2.5">Priority</th>
              <th className="px-3 py-2.5">Deadline</th>
              <th className="px-3 py-2.5">Revision</th>
              <th className="px-3 py-2.5 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400">
                  No topics defined yet. Click "Feasible Plan" above or add a topic.
                </td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id} className={`hover:bg-slate-50/70 ${t.completed ? 'opacity-60 bg-slate-50/40' : ''}`}>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(t.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                      title={t.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {t.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className={`font-semibold text-slate-900 ${t.completed ? 'line-through text-slate-500' : ''}`}>
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{t.subject}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {t.duration_hours} hr{t.duration_hours === 1 ? '' : 's'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getPriorityBadge(t.priority)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    {new Date(t.deadline).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    {t.is_revision ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Revision Task
                      </span>
                    ) : t.requires_revision ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        +1h Follow-up
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteTopic(t.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
