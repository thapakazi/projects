# AGENTS.md — VibeCheck

## What this project is

VibeCheck is a browser-based behavioral habit tracker that uses a webcam and MediaPipe computer vision models to detect and interrupt unconscious body-focused repetitive behaviors (BFRBs) in real-time. All inference runs client-side — no data leaves the browser.

## Tech stack

- **React 19** with TypeScript
- **Vite** for dev server and builds
- **Tailwind CSS** via CDN (`<script src="https://cdn.tailwindcss.com">` in index.html)
- **@mediapipe/tasks-vision** — hand landmark, face landmark, and hair segmentation models
- No backend, no API keys, no server-side processing

## Project structure

```
.
├── index.html          # Entry HTML, loads Tailwind CDN + importmap
├── index.tsx           # React DOM root mount
├── App.tsx             # Top-level component: wires settings, stats, alerts
├── types.ts            # Shared types: HabitMode enum, AppSettings, DetectionStats, Landmark
├── components/
│   ├── Header.tsx      # Top bar with status indicator
│   ├── CameraPanel.tsx # Webcam feed, MediaPipe model init, detection loop, canvas overlays
│   ├── SettingsPanel.tsx  # Mode selector, sensitivity/zoom sliders, toggle switches
│   └── StatsPanel.tsx  # Session timer and alert counter
├── lib/
│   ├── vision-utils.ts # Shared helpers: getDistance, getMaskPoint, FINGER_TIPS constant
│   └── modes/          # One file per detection mode
│       ├── face-common.ts      # checkLandmarkProximity — shared face-landmark proximity logic
│       ├── trichotillomania.ts  # Hair-pulling: checks finger tips against hair segmentation mask
│       ├── skin-picking.ts
│       ├── nail-biting.ts
│       ├── nose-picking.ts
│       ├── beard-pulling.ts
│       └── face-habits.ts
├── vite.config.ts      # Vite config: port 3000, React plugin, @ alias
├── tsconfig.json       # TS config: ES2022, bundler module resolution, react-jsx
├── package.json
├── Justfile            # Dev commands: just dev, just build, just preview
└── metadata.json       # App name + description + permission declarations
```

## Detection modes

Each mode maps to an enum value in `types.ts` (`HabitMode`):

| Mode | Enum value | MediaPipe models used | Detection approach |
|------|-----------|----------------------|-------------------|
| Trichotillomania | `trichotillomania` | HandLandmarker + ImageSegmenter (hair) | Finger tips checked against hair segmentation mask pixels within a radius |
| Skin picking | `skin_picking` | HandLandmarker + FaceLandmarker | Finger tip proximity to face skin landmark indices |
| Nail biting | `nail_biting` | HandLandmarker + FaceLandmarker | Finger tip proximity to mouth landmark indices |
| Nose picking | `nose_picking` | HandLandmarker + FaceLandmarker | Finger tip proximity to nose landmark indices |
| Beard pulling | `beard_pulling` | HandLandmarker + FaceLandmarker | Finger tip proximity to beard/chin landmark indices |

## How the detection loop works

`CameraPanel.tsx` is the core. On mount it:

1. Loads three MediaPipe models (hand landmarker, face landmarker, hair segmenter) with GPU delegate
2. Opens the webcam at 1280x720
3. Runs a `requestAnimationFrame` loop that:
   - Gets hand landmarks from `HandLandmarker.detectForVideo`
   - Depending on the active `HabitMode`, either runs the hair segmenter (trichotillomania) or face landmarker (all others)
   - Calls the corresponding detection function from `lib/modes/`
   - Draws overlays (hair mask, face landmark dots, hand tip dots) on a canvas
   - Calls `onDetection(boolean)` which bubbles up to `App.tsx` to trigger audio alerts

## Settings (AppSettings in types.ts)

- `habitMode` — which detection mode is active
- `sensitivity` (0–1) — maps to distance thresholds or pixel search radius
- `alertInterval` — minimum ms between audio alerts (1s, 3s, 5s, 10s)
- `isAlertEnabled` — toggle sound alerts
- `isBlurred` — privacy blur on the camera feed
- `showDetectionPoints` — toggle landmark/mask visualization
- `zoomLevel` (1.0–3.0) — camera feed zoom

## Development

```sh
just dev      # bun install + vite dev on port 3000
just build    # production build
just preview  # preview the production build
```

## Key things to know

- The video is mirrored (`scaleX(-1)`) for a natural mirror experience
- Audio alert uses a remote .ogg file from `actions.google.com/sounds`
- Tailwind is loaded from CDN, not installed as a dependency
- The `index.html` importmap is for the non-bundled path; Vite handles bundling in dev/build
- No tests exist yet
- No backend, no database, no auth
