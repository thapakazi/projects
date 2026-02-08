
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HabitMode, AppSettings, DetectionStats } from './types';
import Header from './components/Header';
import CameraPanel from './components/CameraPanel';
import SettingsPanel from './components/SettingsPanel';
import StatsPanel from './components/StatsPanel';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    habitMode: HabitMode.TRICHOTILLOMANIA,
    isAlertEnabled: true,
    alertInterval: 3000,
    sensitivity: 0.5,
    isBlurred: true,
    showDetectionPoints: true,
    zoomLevel: 1.0,
    debounceDelay: 1000,
    alertSound: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
    autoPip: true,
  });

  const [stats, setStats] = useState<DetectionStats>({
    alertsTriggered: 0,
    sessionStartTime: Date.now(),
    isHandInZone: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);

  const lastAlertTimeRef = useRef<number>(0);
  const zoneEnteredAtRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio (re-create when alertSound changes)
  useEffect(() => {
    audioRef.current = new Audio(settings.alertSound);
    audioRef.current.volume = 1.0;
  }, [settings.alertSound]);

  // Auto-resume when pauseUntil expires
  useEffect(() => {
    if (!pauseUntil) return;
    const remaining = pauseUntil - Date.now();
    if (remaining <= 0) {
      setIsPaused(false);
      setPauseUntil(null);
      return;
    }
    const timer = setTimeout(() => {
      setIsPaused(false);
      setPauseUntil(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [pauseUntil]);

  const triggerAlert = useCallback(() => {
    const now = Date.now();
    if (settings.isAlertEnabled && now - lastAlertTimeRef.current >= settings.alertInterval) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setStats(prev => ({ ...prev, alertsTriggered: prev.alertsTriggered + 1 }));
      lastAlertTimeRef.current = now;
    }
  }, [settings.isAlertEnabled, settings.alertInterval]);

  const handleDetection = useCallback((inZone: boolean) => {
    setStats(prev => ({ ...prev, isHandInZone: inZone }));
    if (inZone) {
      const now = Date.now();
      if (zoneEnteredAtRef.current === null) {
        zoneEnteredAtRef.current = now;
      }
      if (now - zoneEnteredAtRef.current >= settings.debounceDelay) {
        triggerAlert();
      }
    } else {
      zoneEnteredAtRef.current = null;
    }
  }, [triggerAlert, settings.debounceDelay]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleTogglePause = useCallback(() => {
    setIsPaused(p => !p);
    setPauseUntil(null);
  }, []);

  const handleQuickPause = useCallback((ms: number) => {
    setIsPaused(true);
    setPauseUntil(Date.now() + ms);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, isAlertEnabled: !prev.isAlertEnabled }));
  }, []);

  return (
    <>
    {/* Mini Player - YouTube style bottom-right */}
    {isMiniPlayer && (
      <div className="fixed bottom-4 right-4 z-50 w-80 h-48 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 overflow-hidden [&_video]:blur-lg">
            <CameraPanel
              settings={{...settings, showDetectionPoints: false}}
              onDetection={handleDetection}
              isPaused={isPaused}
            />
          </div>
          {/* Status indicator */}
          <div className="absolute top-2 left-2 z-10">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`} />
          </div>
          {/* Controls overlay */}
          <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-slate-900/90 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePause}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '\u25B6' : '\u23F8'}
              </button>
              <button
                onClick={handleToggleSound}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title={settings.isAlertEnabled ? 'Sound On' : 'Sound Off'}
              >
                {settings.isAlertEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
              </button>
              <span className="text-[10px] font-mono text-slate-400">{stats.alertsTriggered}</span>
            </div>
            <button
              onClick={() => setIsMiniPlayer(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-800/80 hover:bg-slate-700 transition-colors"
              title="Expand"
            >
              &#x2197;
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header
        isPaused={isPaused}
        pauseUntil={pauseUntil}
        stats={stats}
        settings={settings}
        onTogglePause={handleTogglePause}
        onQuickPause={handleQuickPause}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Section: Camera View */}
        <section className="flex-[2] flex flex-col gap-4">
          <CameraPanel
            settings={settings}
            onDetection={handleDetection}
            isPaused={isPaused}
            onToggleBlur={() => updateSettings({ isBlurred: !settings.isBlurred })}
          />
        </section>

        {/* Right Section: Controls & Stats */}
        <section className="flex-1 flex flex-col gap-4 max-w-md">
          <StatsPanel stats={stats} />
          <SettingsPanel
            settings={settings}
            updateSettings={updateSettings}
          />
        </section>
      </main>

      <footer className="p-3 text-center text-xs text-slate-500 glass space-y-1">
        <p>VibeCheck — AI-powered habit awareness that runs entirely in your browser. No data ever leaves your device.</p>
        <p>
          <a href="https://github.com/thapakazi/projects/tree/main/vibecheck" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">✨ GitHub</a>
          <span className="mx-2">·</span>
          <a
            href={"https://x.com/intent/tweet?text=" + encodeURIComponent("Nose picking, nail biting, hair pulling... I got you bro!\n\n👉: https://projects.thapakazi.com/vibecheck/\nVibeCheck — AI-powered habit awareness running entirely in your browser.\n\nNo data leaves your device!! Free & Open !!\n\nmade with\n❤️:https://thapakazi.github.io/projects/vibecheck/\n#vibecare #vibechecked 🍀✌️😎")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >🔗 Share</a>
        </p>
      </footer>
    </div>
    </>
  );
};

export default App;
