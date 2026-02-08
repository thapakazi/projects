
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, DetectionStats } from '../types';

interface HeaderProps {
  isPaused: boolean;
  pauseUntil: number | null;
  stats: DetectionStats;
  settings: AppSettings;
  onTogglePause: () => void;
  onQuickPause: (ms: number) => void;
  onToggleSound: () => void;
}

const QUICK_PAUSE_OPTIONS = [
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hr', ms: 60 * 60 * 1000 },
];

function formatRemaining(until: number): string {
  const diff = Math.max(0, until - Date.now());
  const mins = Math.ceil(diff / 60000);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

const Header: React.FC<HeaderProps> = ({ isPaused, pauseUntil, stats, settings, onTogglePause, onQuickPause, onToggleSound }) => {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update countdown display
  useEffect(() => {
    if (!pauseUntil) { setRemaining(''); return; }
    const tick = () => setRemaining(formatRemaining(pauseUntil));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [pauseUntil]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const badgeColor = isPaused ? 'bg-amber-500' : 'bg-green-500';
  const badgeText = isPaused
    ? `PAUSED${remaining ? ` (${remaining} left)` : ''}`
    : 'ACTIVE';

  return (
    <header className="h-16 flex items-center justify-between px-6 glass shadow-xl z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">Vibe<span className="text-indigo-400 font-medium">Check</span></h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
        >
          <span className={`w-2 h-2 rounded-full ${badgeColor} ${!isPaused ? 'status-pulse' : ''}`}></span>
          <span className="text-xs font-medium text-slate-300">{badgeText}</span>
          <svg className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 z-50">
            {/* Pause / Resume */}
            <button
              onClick={() => { onTogglePause(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
            >
              {isPaused ? (
                <><span className="text-green-400">&#9654;</span> Resume Monitoring</>
              ) : (
                <><span className="text-amber-400">&#10074;&#10074;</span> Pause Monitoring</>
              )}
            </button>

            {/* Quick Pause */}
            {!isPaused && (
              <div className="px-4 py-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Pause</span>
                <div className="flex gap-1.5 mt-1.5">
                  {QUICK_PAUSE_OPTIONS.map(opt => (
                    <button
                      key={opt.ms}
                      onClick={() => { onQuickPause(opt.ms); setOpen(false); }}
                      className="px-2 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 my-1" />

            {/* Sound Toggle */}
            <button
              onClick={() => { onToggleSound(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
            >
              {settings.isAlertEnabled ? (
                <><span>&#128264;</span> Sound On</>
              ) : (
                <><span>&#128263;</span> Sound Off</>
              )}
            </button>

            <div className="border-t border-slate-700 my-1" />

            {/* Stats */}
            <div className="px-4 py-2 text-xs text-slate-400">
              Today&apos;s Alerts: <span className="text-slate-200 font-medium">{stats.alertsTriggered}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
