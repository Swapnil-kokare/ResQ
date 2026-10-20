import React, { useState } from 'react'
import {
  GraduationCap,
  Calendar,
  Clock,
  Plus,
  Trash2,
  MapPin,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import type { CollegeExamPaper } from '../types'

interface CollegeExamManagerProps {
  exams: CollegeExamPaper[]
  startDate: string
  onAddExam: (exam: CollegeExamPaper) => void
  onRemoveExam: (id: string) => void
  onLoadPresetExams: () => void
}

export const CollegeExamManager: React.FC<CollegeExamManagerProps> = ({
  exams,
  startDate,
  onAddExam,
  onRemoveExam,
  onLoadPresetExams
}) => {
  const [subject, setSubject] = useState('')
  const [paperTitle, setPaperTitle] = useState('')
  const [examDate, setExamDate] = useState('2026-10-21T10:00:00')
  const [durationHours, setDurationHours] = useState('3.0')
  const [venue, setVenue] = useState('Hall A (Main Block)')
  const [error, setError] = useState<string | null>(null)

  // Calculate live human-readable countdown
  const getExamCountdown = (examDateStr: string) => {
    try {
      const examTime = new Date(examDateStr).getTime()
      const now = new Date(`${startDate}T08:00:00`).getTime()
      const diffMs = examTime - now
      if (diffMs <= 0) return 'Exam In Progress / Completed'
      const totalHours = Math.round(diffMs / (1000 * 60 * 60))
      if (totalHours < 24) return `${totalHours} hrs left`
      const days = Math.floor(totalHours / 24)
      const hours = totalHours % 24
      return `${days}d ${hours}h left`
    } catch {
      return 'Scheduled'
    }
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setError('Subject name cannot be empty')
      return
    }
    if (!paperTitle.trim()) {
      setError('Paper title or course code cannot be empty')
      return
    }
    const dur = parseFloat(durationHours)
    if (isNaN(dur) || dur <= 0) {
      setError('Exam duration must be greater than 0 hours')
      return
    }

    const newExam: CollegeExamPaper = {
      id: `exam_${Date.now()}`,
      subject: subject.trim(),
      paper_title: paperTitle.trim(),
      exam_date: examDate,
      duration_hours: dur,
      venue: venue.trim() || undefined
    }

    onAddExam(newExam)
    setSubject('')
    setPaperTitle('')
    setError(null)
  }

  // Sort exams chronologically
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-rose-600" />
            College Exam Timetable (Official Schedule)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Input your official exam dates and times. ResQ's CSP solver schedules preparation blocks leading into each exam with zero clashes.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadPresetExams}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs transition-colors shrink-0"
          title="Auto-fill 3 college exam papers to test schedule generation"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Exam Timetable</span>
        </button>
      </div>

      {/* Input Form for College Exam Paper */}
      <form onSubmit={handleAdd} className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject Name</label>
            <input
              type="text"
              placeholder="e.g. Artificial Intelligence"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper Title / Code</label>
            <input
              type="text"
              placeholder="e.g. CS401 Theory (Paper 1)"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Exam Date & Time</label>
            <input
              type="datetime-local"
              value={examDate.slice(0, 16)}
              onChange={(e) => setExamDate(`${e.target.value}:00`)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="6"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Venue / Exam Hall</label>
            <input
              type="text"
              placeholder="e.g. Hall A / Lab 3"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            Adding an exam sets hard deadlines for that subject's study modules and blocks out the exam time in the timetable.
          </span>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam Paper</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* College Exam Schedule List */}
      {sortedExams.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
          No college exam papers entered yet. Click "Load Sample Exam Timetable" or add your exam papers above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedExams.map((exam, idx) => {
            const eStart = new Date(exam.exam_date)
            const eEnd = new Date(eStart.getTime() + exam.duration_hours * 3600 * 1000)
            const timeStr = `${eStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${eEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            const dateStr = eStart.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            const countdownStr = getExamCountdown(exam.exam_date)

            return (
              <div
                key={exam.id}
                className="relative rounded-lg border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-rose-600 text-white shadow-2xs">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        Paper {idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-700 ml-1.5">
                        {exam.duration_hours} hrs
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveExam(exam.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove exam paper"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-xs font-bold text-slate-900 m-0">
                    {exam.subject}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    {exam.paper_title}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-rose-200/60 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Calendar className="w-3 h-3 text-rose-600" />
                      {dateStr}
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                      {countdownStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeStr}
                    </span>
                    {exam.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {exam.venue}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
