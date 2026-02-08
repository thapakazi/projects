
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
    isBlurred: false,
    showDetectionPoints: true,
    zoomLevel: 1.0,
    debounceDelay: 1000,
    alertSound: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
  });

  const [stats, setStats] = useState<DetectionStats>({
    alertsTriggered: 0,
    sessionStartTime: Date.now(),
    isHandInZone: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);

  const lastAlertTimeRef = useRef<number>(0);
  const zoneEnteredAtRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio (re-create when alertSound changes)
  useEffect(() => {
    audioRef.current = new Audio(settings.alertSound);
    audioRef.current.volume = 0.5;
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
  );
};

export default App;
