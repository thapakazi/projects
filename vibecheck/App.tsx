
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
  });

  const [stats, setStats] = useState<DetectionStats>({
    alertsTriggered: 0,
    sessionStartTime: Date.now(),
    isHandInZone: false,
  });

  const lastAlertTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    // Using a high-quality kick sound URL
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
    audioRef.current.volume = 0.5;
  }, []);

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
      triggerAlert();
    }
  }, [triggerAlert]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header />
      
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Section: Camera View */}
        <section className="flex-[2] flex flex-col gap-4">
          <CameraPanel 
            settings={settings} 
            onDetection={handleDetection}
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

      <footer className="p-2 text-center text-xs text-slate-500 glass">
        VibeCheck v1.0.0 — Privacy Focused: All processing happens on your device.
      </footer>
    </div>
  );
};

export default App;
