import React from 'react'
import { Calendar, BookOpen, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import type { ScheduleResponse } from '../types'

interface DashboardStatsProps {
  examDatetime: string
  totalTopics: number
  totalRequiredHours: number
  availableStudyHours: number
  scheduleResponse: ScheduleResponse | null
  isLoading: boolean
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  examDatetime,
  totalTopics,
  totalRequiredHours,
  availableStudyHours,
  scheduleResponse,
  isLoading
}) => {
  // Calculate countdown to exam
  const getExamCountdown = () => {
    try {
      const examTime = new Date(examDatetime).getTime()
      const now = new Date('2026-10-20T07:00:00').getTime()
      const diffMs = examTime - now
      if (diffMs <= 0) return 'Exam In Progress'
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${days}d ${hours}h remaining`
    } catch {
      return 'Scheduled'
    }
  }

  const isFeasible = scheduleResponse?.success === true
  const statusText = isLoading
    ? 'Solving CSP...'
    : !scheduleResponse
    ? 'Ready to Solve'
    : scheduleResponse.status === 'FEASIBLE'
    ? 'Certified Feasible'
    : scheduleResponse.status === 'SEARCH_LIMIT_REACHED'
    ? 'Limit Reached'
    : 'Infeasible Plan'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Exam Countdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Exam Countdown</span>
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{getExamCountdown()}</div>
        <p className="text-xs text-slate-500 mt-1 truncate">
          Exam: {new Date(examDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* 2. Required Study Workload */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Required Study Load</span>
          <BookOpen className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{totalRequiredHours}h Required</div>
        <p className="text-xs text-slate-500 mt-1">
          {totalTopics} topic{totalTopics === 1 ? '' : 's'} across curriculum
        </p>
      </div>

      {/* 3. Available Study Window */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Free Study Capacity</span>
          <Clock className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">
          {scheduleResponse ? `${scheduleResponse.available_study_hours}h Free` : `${availableStudyHours}h Est.`}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Excludes college, sleep & meals
        </p>
      </div>

      {/* 4. Feasibility Status */}
      <div className={`rounded-xl border p-4 shadow-xs ${
        isLoading
          ? 'bg-blue-50/50 border-blue-200'
          : !scheduleResponse
          ? 'bg-white border-slate-200'
          : isFeasible
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-rose-50/60 border-rose-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            CSP Feasibility
          </span>
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          ) : !scheduleResponse ? (
            <AlertCircle className="w-4 h-4 text-slate-400" />
          ) : isFeasible ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600" />
          )}
        </div>
        <div className={`text-xl font-bold ${
          !scheduleResponse ? 'text-slate-700' : isFeasible ? 'text-emerald-700' : 'text-rose-700'
        }`}>
          {statusText}
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {scheduleResponse
            ? `${scheduleResponse.stats.backtracks} backtracks · ${scheduleResponse.stats.elapsed_time_ms}ms`
            : 'Click Generate to schedule'}
        </p>
      </div>
    </div>
  )
}
