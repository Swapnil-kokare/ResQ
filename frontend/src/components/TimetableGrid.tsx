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
  School,
  Printer,
  FileText
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

  // Helper to build clean HTML for both printable PDF and Word Doc
  const generateExportHtml = (isWordDoc: boolean = false) => {
    const studyHours = sessions
      .filter((s) => s.session_type === 'study')
      .reduce((acc, s) => acc + s.duration_hours, 0)
    const revHours = sessions
      .filter((s) => s.session_type === 'revision')
      .reduce((acc, s) => acc + s.duration_hours, 0)
    const genDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Group sessions by day
    const dayIndices = Array.from({ length: numDays }, (_, i) => i + 1)

    const daySectionsHtml = dayIndices.map((dayNum) => {
      const dayDate = new Date(startDate)
      dayDate.setDate(dayDate.getDate() + dayNum - 1)
      const dayDateStr = dayDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })

      const daySessions = sessions
        .filter((s) => s.day_index === dayNum)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      if (daySessions.length === 0) {
        return `
          <div style="margin-bottom: 24px; page-break-inside: avoid;">
            <h3 style="color: #1e3a8a; border-bottom: 2px solid #93c5fd; padding-bottom: 4px; margin-bottom: 8px; font-size: 15px;">
              Day ${dayNum} &mdash; ${dayDateStr}
            </h3>
            <p style="color: #64748b; font-size: 12px; font-style: italic;">No sessions scheduled for this day.</p>
          </div>
        `
      }

      const rowsHtml = daySessions.map((s) => {
        const sStart = new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const sEnd = new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        let typeBadgeColor = '#e2e8f0'
        let typeTextColor = '#334155'
        if (s.session_type === 'study') {
          typeBadgeColor = '#dbeafe'
          typeTextColor = '#1e40af'
        } else if (s.session_type === 'revision') {
          typeBadgeColor = '#f3e8ff'
          typeTextColor = '#6b21a8'
        } else if (s.session_type === 'break') {
          typeBadgeColor = '#dcfce7'
          typeTextColor = '#166534'
        }

        const statusLabel = s.completed ? 'Completed' : s.is_locked ? 'Locked' : 'Scheduled'

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px; font-weight: 600; color: #1e293b; white-space: nowrap;">
              ${sStart} &ndash; ${sEnd}
            </td>
            <td style="padding: 8px 10px; color: #475569; text-align: center;">
              ${s.duration_hours} hr${s.duration_hours === 1 ? '' : 's'}
            </td>
            <td style="padding: 8px 10px; text-align: center;">
              <span style="background-color: ${typeBadgeColor}; color: ${typeTextColor}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                ${s.session_type}
              </span>
            </td>
            <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">
              ${s.subject || 'General'}
            </td>
            <td style="padding: 8px 10px; color: #334155;">
              ${s.title}
            </td>
            <td style="padding: 8px 10px; color: #64748b; text-align: center; font-size: 11px;">
              ${statusLabel}
            </td>
          </tr>
        `
      }).join('')

      return `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <h3 style="color: #1e3a8a; border-bottom: 2px solid #93c5fd; padding-bottom: 4px; margin-bottom: 8px; font-size: 15px;">
            Day ${dayNum} &mdash; ${dayDateStr}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px;" border="1" bordercolor="#e2e8f0">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; text-align: left; font-size: 11px;">
                <th style="padding: 8px 10px; width: 140px;">Time Window</th>
                <th style="padding: 8px 10px; width: 70px; text-align: center;">Duration</th>
                <th style="padding: 8px 10px; width: 90px; text-align: center;">Category</th>
                <th style="padding: 8px 10px; width: 160px;">Subject</th>
                <th style="padding: 8px 10px;">Topic / Activity</th>
                <th style="padding: 8px 10px; width: 90px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html ${isWordDoc ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"' : ''}>
      <head>
        <meta charset="utf-8">
        <title>ResQ Study Plan &mdash; ${genDate}</title>
        <style>
          @media print {
            @page {
              size: A4 portrait;
              margin: 14mm 12mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            line-height: 1.45;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
          }
          .header-banner {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #475569;
            margin: 4px 0 0 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
          }
          .btn-print {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #1d4ed8;
          }
          .footer {
            margin-top: 36px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px;">
          <div>
            <span style="font-weight: bold; color: #1e40af; font-size: 14px;">Print / Save as PDF Preview</span>
            <p style="margin: 2px 0 0; font-size: 12px; color: #3b82f6;">Select "Save as PDF" as Destination in the Print Dialog for a clean PDF file.</p>
          </div>
          <button class="btn-print" onclick="window.print()">
            Print / Save to PDF
          </button>
        </div>

        <div class="header-banner">
          <h1 class="title">ResQ &mdash; AI Study Planner</h1>
          <p class="subtitle">Personalized Deadline Schedule &bull; Constraint Satisfaction Problem (CSP) Verified</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Schedule Span</span>
            <span class="meta-value">${numDays} Days (${startDate})</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Study Chunks</span>
            <span class="meta-value">${studyHours.toFixed(1)} Hours</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Revision Chunks</span>
            <span class="meta-value">${revHours.toFixed(1)} Hours</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Constraint Status</span>
            <span class="meta-value" style="color: #166534;">Conflict-Free Verified</span>
          </div>
        </div>

        ${daySectionsHtml}

        <div class="footer">
          <span>Generated by ResQ AI Study Planner on ${genDate}</span>
          <span>Algorithms: MRV Heuristic &bull; Forward Checking &bull; Backtracking Search</span>
        </div>
      </body>
      </html>
    `
  }

  // Export as PDF (Print to PDF)
  const handleExportPDF = () => {
    if (!sessions || sessions.length === 0) return
    const html = generateExportHtml(false)
    const printWindow = window.open('', '_blank', 'width=950,height=750')
    if (!printWindow) {
      alert('Please allow pop-ups to open the PDF print view.')
      return
    }
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    // Give browser brief tick to render fonts before print dialog
    setTimeout(() => {
      printWindow.print()
    }, 400)
  }

  // Export as Microsoft Word Document (.doc)
  const handleExportWordDoc = () => {
    if (!sessions || sessions.length === 0) return
    const html = generateExportHtml(true)
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ResQ_Study_Plan_${new Date().toISOString().slice(0, 10)}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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

          {/* Export Options */}
          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={!hasSchedule || sessions.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              title="Print or Save as PDF document"
            >
              <Printer className="w-3.5 h-3.5 text-red-600" />
              <span>PDF</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <button
              type="button"
              onClick={handleExportWordDoc}
              disabled={!hasSchedule || sessions.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              title="Export formatted Word Document (.doc)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Docs</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!hasSchedule || sessions.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              title="Export raw spreadsheet data (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
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
