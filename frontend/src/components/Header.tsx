import React from 'react'
import { Sparkles, Activity, ShieldCheck, Clock } from 'lucide-react'

interface HeaderProps {
  isBackendHealthy: boolean | null
  lastSolvingTimeMs?: number
}

export const Header: React.FC<HeaderProps> = ({ isBackendHealthy, lastSolvingTimeMs }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">ResQ</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                AI CSP Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Your deadlines. A plan. Less panic.</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">MRV + Forward Checking</span>
          </div>

          {lastSolvingTimeMs !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Solver: <strong className="font-semibold text-slate-900">{lastSolvingTimeMs}ms</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Activity className={`w-3.5 h-3.5 ${isBackendHealthy ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className="font-medium text-slate-700">
              {isBackendHealthy === null ? 'Connecting...' : isBackendHealthy ? 'Backend Connected' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
