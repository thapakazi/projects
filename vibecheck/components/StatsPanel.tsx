
import React, { useState, useEffect } from 'react';
import { DetectionStats } from '../types';

interface StatsPanelProps {
  stats: DetectionStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - stats.sessionStartTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.sessionStartTime]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-5 glass rounded-3xl border border-slate-700 flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Time</span>
        <span className="text-2xl font-mono font-bold text-indigo-400">{elapsed}</span>
      </div>
      
      <div className={`p-5 glass rounded-3xl border transition-all duration-300 flex flex-col gap-1 ${stats.isHandInZone ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10' : 'border-slate-700'}`}>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alerts Triggered</span>
        <div className="flex items-end gap-2">
          <span className={`text-2xl font-mono font-bold transition-colors ${stats.isHandInZone ? 'text-red-400' : 'text-slate-100'}`}>
            {stats.alertsTriggered}
          </span>
          {stats.isHandInZone && (
            <span className="text-[10px] text-red-400 font-bold mb-1 animate-pulse">DETECTED!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
