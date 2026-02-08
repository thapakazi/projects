
export enum HabitMode {
  TRICHOTILLOMANIA = 'trichotillomania',
  SKIN_PICKING = 'skin_picking',
  NAIL_BITING = 'nail_biting',
  NOSE_PICKING = 'nose_picking',
  BEARD_PULLING = 'beard_pulling'
}

export interface AppSettings {
  habitMode: HabitMode;
  isAlertEnabled: boolean;
  alertInterval: number; // in ms
  sensitivity: number; // 0 to 1
  isBlurred: boolean;
  showDetectionPoints: boolean;
  zoomLevel: number;
  debounceDelay: number; // ms, 1000–5000
  alertSound: string; // URL for alert sound
}

export interface DetectionStats {
  alertsTriggered: number;
  sessionStartTime: number;
  isHandInZone: boolean;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}
