import React, { useState } from 'react'
import {
  Activity,
  CornerDownLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info
} from 'lucide-react'
import type { SolverEvent, SolverStats } from '../types'

interface AlgorithmActivityPanelProps {
  events: SolverEvent[]
  stats?: SolverStats
}

export const AlgorithmActivityPanel: React.FC<AlgorithmActivityPanelProps> = ({
  events,
  stats
}) => {
  const [filterType, setFilterType] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true
    return ev.event_type === filterType
  })

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'variable_selected':
        return {
          label: 'MRV Picked',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Layers
        }
      case 'slot_considered':
        return {
          label: 'Slot Tested',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock
        }
      case 'constraint_violated':
        return {
          label: 'Pruned / FC Wipeout',
          className: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle
        }
      case 'backtrack':
        return {
          label: 'Backtrack',
          className: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: CornerDownLeft
        }
      case 'assignment_accepted':
        return {
          label: 'Slot Accepted',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2
        }
      case 'solution_found':
        return {
          label: 'Solution Found',
          className: 'bg-emerald-600 text-white border-emerald-700',
          icon: CheckCircle2
        }
      default:
        return {
          label: type,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Activity
        }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-8 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
              CSP Solver Execution Trace
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Live Backend Solver Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect step-by-step backtracking, MRV variable selection, and forward-checking pruning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium">
                {stats.assignments_attempted} tests
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium">
                {stats.backtracks} backtracks
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium">
                {stats.elapsed_time_ms}ms
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200/60 transition-colors"
            title={isExpanded ? 'Collapse activity log' : 'Expand activity log'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Theory / College Presentation Explainer Box */}
          <div className="mb-3.5 p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">How the CSP Engine Works: </span>
              Variables (study sessions) are chosen dynamically using <strong>Minimum Remaining Values (MRV)</strong> to fail early.
              Candidate start intervals are checked against hard constraints (overlap, sleep, college, deadlines).
              Whenever a slot is tentatively assigned, <strong>Forward Checking</strong> prunes conflicting candidate slots from remaining variables, immediately triggering backtracking if a domain wipeout occurs.
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pb-3 mb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter Trace:</span>
            {[
              { id: 'all', label: `All Events (${events.length})` },
              { id: 'variable_selected', label: 'MRV Selection' },
              { id: 'assignment_accepted', label: 'Accepted Slots' },
              { id: 'constraint_violated', label: 'Pruned / Wipeouts' },
              { id: 'backtrack', label: 'Backtracks' },
              { id: 'solution_found', label: 'Solved' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === f.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Event Stream Log */}
          {events.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No solver activity recorded yet. Run a schedule to generate the execution trace.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
              {filteredEvents.map((ev) => {
                const badge = getEventBadge(ev.event_type)
                const BadgeIcon = badge.icon

                return (
                  <div
                    key={ev.step}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold w-8 shrink-0 pt-0.5">
                      #{ev.step}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.className}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      {ev.variable_name && (
                        <span className="font-semibold text-slate-900 mr-2">
                          {ev.variable_name}
                        </span>
                      )}

                      {ev.slot_description && (
                        <span className="text-blue-700 font-medium mr-2">
                          [{ev.slot_description}]
                        </span>
                      )}

                      {ev.reason && (
                        <span className="text-slate-600 font-sans text-xs">
                          {ev.reason}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      +{ev.timestamp_ms}ms
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
