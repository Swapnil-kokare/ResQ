import React from 'react'
import { AlertTriangle, Zap, CheckCircle2, RotateCcw } from 'lucide-react'
import type { DemoScenario } from '../types'

interface ScenarioDemoBarProps {
  scenarios: DemoScenario[]
  activeScenarioId: string | null
  isLoading: boolean
  onSelectScenario: (scenario: DemoScenario) => void
  onReset: () => void
}

export const ScenarioDemoBar: React.FC<ScenarioDemoBarProps> = ({
  scenarios,
  activeScenarioId,
  isLoading,
  onSelectScenario,
  onReset
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 m-0">
              Live Demonstration Scenarios
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              3 Preset College Test Cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate the CSP engine against feasible, dynamic replanning, and overconstrained inputs.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {scenarios.map((sc) => {
            const isActive = activeScenarioId === sc.id
            let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200'
            let Icon = CheckCircle2

            if (sc.id === 'urgent_task') {
              badgeBg = 'bg-blue-50 text-blue-700 border-blue-200'
              Icon = Zap
            } else if (sc.id === 'impossible') {
              badgeBg = 'bg-rose-50 text-rose-700 border-rose-200'
              Icon = AlertTriangle
            }

            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs border ${
                  isActive
                    ? 'ring-2 ring-blue-500 ring-offset-1 bg-white text-slate-900 border-blue-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={sc.description}
              >
                <Icon className={`w-3.5 h-3.5 ${sc.id === 'impossible' ? 'text-rose-600' : sc.id === 'urgent_task' ? 'text-blue-600' : 'text-emerald-600'}`} />
                <span>{sc.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${badgeBg}`}>
                  {sc.badge}
                </span>
              </button>
            )
          })}

          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent"
            title="Reset to default planning settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}
