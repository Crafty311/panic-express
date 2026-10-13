# Implementation Plan: Modern Sleek Train Journey & Signal Post Microgames Overhaul

## Problem & Vision
The user expressed three key requirements to elevate the applet:
1. **Decouple Continuous Microgames**: Transition microgames from an intrusive constant loop back into a rewarding side feature triggered at scheduled railway signal posts or on demand from the conductor console.
2. **Rotating 5-Track Chillhop BGM**: Add an online rotating playlist of 5 distinct upbeat chillhop / modern lounge audio tracks that play for exactly 1 minute (60 seconds) each, then advance automatically in an endless loop, complete with a sleek media controller.
3. **100+ Procedural Microgame Variants**: Expand the minigame system from a handful of static games into a dynamic generator capable of 100+ unique microgame variants across reflex, balance, tapping, observation, and timing categories.
4. **Modern Sleek Glassmorphism & Refined Typography**: Eliminate childish comic styling (chunky dark borders, loud yellow blocks). Elevate the entire interface to a luxury modern observation car aesthetic with frosted glassmorphism (`backdrop-blur-xl`, `bg-stone-900/40`, hairline `border-white/10`), refined typographic scale (`Plus Jakarta Sans` with monospace tabular nums), and fluid interactive physics.

---

## Architecture & Proposed Changes

### 1. Audio Engine & 60-Second Rotating Chillhop Playlist (`src/services/audioService.ts`)
- **Online Streaming Chillhop Tracks**: Curate 5 reliable, royalty-free upbeat chillhop / modern lounge audio streams:
  1. *Track 1: Velvet Rails (Chillhop Horizon)*
  2. *Track 2: Midnight Lounge (Lo-Fi Grooves)*
  3. *Track 3: Neon Skylines (Urban Chill)*
  4. *Track 4: Golden Hour Sunset (Acoustic Beats)*
  5. *Track 5: Starlight Express (Down-tempo Warmth)*
- **1-Minute Track Scheduler**: Implement a timer tracking exact playback elapsed time. When 60 seconds are reached, smoothly crossfade to the next track in the 5-song cycle and repeat indefinitely.
- **Synthesized Web Audio Fail-Safe**: If online network audio encounters a stall or block, automatically synthesize rich chillhop chord pads and rhythmic beats so background music is guaranteed to never silence.
- **Modern Compact Glass Player**: Floating glass pill widget displaying current track title, an animated circular or linear 60s progress bar, play/pause, skip, and volume slider.

### 2. Modern Sleek Glassmorphism UI & Refined Typography (`src/components/CompartmentInterior.tsx`, `src/index.css`)
- **Visual Language Overhaul**:
  - Replace thick cartoon borders (`border-4 border-stone-950`) with sleek translucent glass panels (`backdrop-blur-xl bg-stone-950/40 border border-white/10 shadow-2xl`).
  - Sleek modern observation carriage framing with expansive panoramic visibility (90%+ window area).
  - Modern typography hierarchy using Plus Jakarta Sans with crisp tabular numbers (`tabular-nums`) and subtle letter spacing (`tracking-tight` for display, `tracking-wide` for uppercase metadata).
- **Interactive Observation Console**:
  - Minimalist floating HUD: Clean speed gauge, upcoming station progress bar, currency, score, and audio player.
  - Interactive table trinkets (steaming beverage with realistic vapor, modern digital chronometer, audio terminal).

### 3. Railway Signal Post Milestone Microgames (`src/components/MicrogameOverlay.tsx`, `src/data/microgames.ts`)
- **Milestone Signal Trigger**: As the train cruises along the scenic route, railway signal posts appear at regular distance intervals (e.g., every 3 km). Passing a signal post displays a sleek glass notification banner: *"Signal Post Ahead: Optional Milestone Challenge!"* with a 1-tap accept button, yielding high rewards without interrupting players who just want to chill and gaze out the window.
- **On-Demand Conductor Console**: Players can also tap *"Take Challenge"* on the console anytime to play.
- **100+ Procedural Microgame Variants Engine**:
  - Implement a procedural variation matrix across 8 core mechanics:
    1. **Signal Lever Switching**: 15 color/code variations and speed multipliers.
    2. **Precision Ticket Validation**: 18 destination/stamp variations with forgery checks.
    3. **Boiler & Dynamo Throttle Balancing**: 12 sweet-spot frequency configurations.
    4. **Window Debris Cleansing**: 12 splatter types, positions, and squeegee gestures.
    5. **Tunnel & Obstacle Clearance Reflex**: 15 hazard signs, heights, and ducking timings.
    6. **Beverage & Luggage Balancing**: 14 center-of-gravity and wobble physics variations.
    7. **Fast Passenger Awakening / Notification**: 12 passenger stories and tap patterns.
    8. **Telegraph / Station Morse Dispatch**: 16 rhythmic sequence decryption variants.
  - Combining these mechanics with random modifiers (speed ramp, inverted axes, target shifts) yields well over 100 distinct gameplay scenarios.

### 4. Fluid Scenic Panoramic Scenery Canvas (`src/components/TrainWindowCanvas.tsx`)
- Smooth 60fps parallax renderer with comfortable modern art direction:
  - Multi-tier mountain horizons, rolling hills with subtle atmospheric mist, passing modern viaducts, windmills, and dynamic time-of-day skies.
  - Fluid particle effects: wind streaks, gentle floating leaves, birds in flight, and ambient glass lighting.

---

## Verification Plan

1. **Audio & 60-Second Loop Verification**:
   - Verify all 5 chillhop tracks load and stream cleanly.
   - Verify that after 60 seconds of playback, the player automatically triggers a smooth switch to the next track and loops after track 5.
   - Verify volume, mute, skip, and Web Audio fallback work without stutter.
2. **Signal Post & Side Feature Microgames**:
   - Verify the main game remains in peaceful train journey mode by default without forcing continuous minigames.
   - Verify milestone signal notifications appear periodically and can be accepted or bypassed.
   - Test microgame generation across all variant categories.
3. **Design & Modern Typography Verification**:
   - Inspect interface contrast and legibility (WCAG AA compliant).
   - Ensure glassmorphic panels do not occlude the panoramic window.
   - Confirm all text is in pristine English without childish comic borders or foreign characters.
4. **Build & Compilation**:
   - Run `lint_applet` and `compile_applet` to ensure zero TypeScript or Vite errors.
