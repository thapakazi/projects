
import React from 'react';
import { AppSettings, HabitMode } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, updateSettings }) => {
  return (
    <div className="flex flex-col gap-6 p-6 glass rounded-3xl border border-slate-700">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Controls
      </h2>

      {/* Habit Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detection Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(HabitMode).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ habitMode: mode })}
              className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all border ${
                settings.habitMode === mode 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {mode.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sensitivity</label>
            <span className="text-xs font-mono text-indigo-400">{Math.round(settings.sensitivity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zoom Level</label>
            <span className="text-xs font-mono text-indigo-400">{settings.zoomLevel.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="1.0" max="3.0" step="0.1" 
            value={settings.zoomLevel}
            onChange={(e) => updateSettings({ zoomLevel: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Sound Alerts</span>
          <button 
            onClick={() => updateSettings({ isAlertEnabled: !settings.isAlertEnabled })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.isAlertEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.isAlertEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Privacy Blur</span>
          <button 
            onClick={() => updateSettings({ isBlurred: !settings.isBlurred })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.isBlurred ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.isBlurred ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Show Detection Points</span>
          <button 
            onClick={() => updateSettings({ showDetectionPoints: !settings.showDetectionPoints })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showDetectionPoints ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.showDetectionPoints ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Interval */}
      <div className="space-y-2">
         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Interval (seconds)</label>
         <select 
          value={settings.alertInterval}
          onChange={(e) => updateSettings({ alertInterval: parseInt(e.target.value) })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
         >
           <option value={1000}>1 second</option>
           <option value={3000}>3 seconds</option>
           <option value={5000}>5 seconds</option>
           <option value={10000}>10 seconds</option>
         </select>
      </div>
    </div>
  );
};

export default SettingsPanel;
