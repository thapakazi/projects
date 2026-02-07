<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VibeCheck

A behavioral habit tracker and alert system that uses your webcam and [MediaPipe](https://ai.google.dev/edge/mediapipe/framework) to detect and interrupt unconscious habits in real-time. All processing runs locally on your device — nothing leaves your browser.

### Supported modes

- **Trichotillomania** — hair pulling
- **Skin picking**
- **Nail biting**
- **Nose picking**
- **Beard pulling**

### How it works

VibeCheck uses MediaPipe hand and face landmark models to track your hands relative to your face. When it detects your hand entering a configured zone (e.g. near hair, mouth, nose), it triggers an audio alert. You can tune sensitivity, alert interval, blur the camera feed for privacy, and toggle detection point overlays.

## Getting started

**Prerequisites:** [Bun](https://bun.sh)

```sh
just dev
```

Or without `just`:

```sh
bun install
bun run dev
```

### Other commands

```sh
just build    # production build
just preview  # preview production build locally
```
