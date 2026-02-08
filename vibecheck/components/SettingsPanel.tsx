
import React, { useState } from 'react';
import { AppSettings, HabitMode } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, updateSettings }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6 glass rounded-3xl border border-slate-700">
      {/* Detection Mode */}
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Me After</label>
            <span className="text-xs font-mono text-indigo-400">{(settings.debounceDelay / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="500" max="3500" step="500"
            value={settings.debounceDelay}
            onChange={(e) => updateSettings({ debounceDelay: parseInt(e.target.value) })}
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

        {settings.isAlertEnabled && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Sound</label>
            <select
              value={settings.alertSound}
              onChange={(e) => {
                const url = e.target.value;
                updateSettings({ alertSound: url });
                const preview = new Audio(url);
                preview.volume = 1.0;
                preview.play().catch(() => {});
                setTimeout(() => { preview.pause(); preview.currentTime = 0; }, 2000);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg">⏰ Digital Alarm</option>
              <option value="https://actions.google.com/sounds/v1/human_voices/human_fart.ogg">💨 Fart</option>
              <option value="https://actions.google.com/sounds/v1/animals/buzzing_fly.ogg">🪰 Buzzing Fly</option>
              <option value="https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg">🎺 Bugle</option>
              <option value="https://actions.google.com/sounds/v1/weather/distant_thunder.ogg">⛈️ Thunder</option>
              <option value="https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg">🚨 Police Siren</option>
              <option value="https://actions.google.com/sounds/v1/weapons/gunshot_and_echo_long.ogg">💥 Gunshot</option>
            </select>
          </div>
        )}

      </div>

      {/* Advanced Options */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => setShowAdvanced(a => !a)}
          className="flex items-center justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
        >
          Advanced Options
          <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4">
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

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Show Detection Points</span>
              <button
                onClick={() => updateSettings({ showDetectionPoints: !settings.showDetectionPoints })}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showDetectionPoints ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.showDetectionPoints ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Auto PiP on Tab Switch</span>
              <button
                onClick={() => updateSettings({ autoPip: !settings.autoPip })}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoPip ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.autoPip ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
