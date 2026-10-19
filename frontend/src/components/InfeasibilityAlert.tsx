import React from 'react'
import { AlertOctagon, Lightbulb, HelpCircle, ChevronRight, Ban } from 'lucide-react'
import type { ScheduleResponse } from '../types'

interface InfeasibilityAlertProps {
  scheduleResponse: ScheduleResponse
}

export const InfeasibilityAlert: React.FC<InfeasibilityAlertProps> = ({ scheduleResponse }) => {
  if (scheduleResponse.success) return null

  const { infeasibility_reason, bottleneck_analysis, unscheduled_topics, suggestions, stats } = scheduleResponse

  return (
    <div className="bg-rose-50/90 border border-rose-300 rounded-xl p-5 shadow-xs mb-6 text-slate-800">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-rose-900 m-0">
              {stats.status === 'SEARCH_LIMIT_REACHED' ? 'Search Limit Reached (Inconclusive)' : 'Mathematically Infeasible Schedule Detected'}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
              CSP Backtrack Exhausted
            </span>
          </div>

          <p className="text-xs text-rose-800 mt-1 font-medium">
            {infeasibility_reason || 'The requested study tasks cannot fit within the available time before your deadlines without violating hard constraints.'}
          </p>

          {/* Bottleneck Analysis */}
          {bottleneck_analysis && (
            <div className="mt-3 p-3 bg-white/80 rounded-lg border border-rose-200 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                Root Cause & Bottleneck Analysis:
              </div>
              <p className="text-slate-700 leading-relaxed">
                {bottleneck_analysis}
              </p>
            </div>
          )}

          {/* Unscheduled topics */}
          {unscheduled_topics && unscheduled_topics.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5 text-rose-600" /> Unscheduled Tasks ({unscheduled_topics.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unscheduled_topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-rose-200/80">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Actionable Solutions to Achieve Feasibility:
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
