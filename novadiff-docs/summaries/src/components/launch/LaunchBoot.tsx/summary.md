### Overview  
A new component `src/components/launch/LaunchBoot.tsx` (lines 1‑216) drives the NovaDiff startup animation. It renders a dialog with a logo, typewriter‑style text, a progress bar, and a skip prompt, and it calls a single `onExitComplete` callback when the exit fade finishes.

### Key changes  
- **Imports** (lines 1‑9): React hooks, `appMark` icon, launch constants (`LAUNCH_EXIT_FADE_MS`, `LAUNCH_HOLD_MS`, `LAUNCH_HOLD_SKIP_AFTER_MS`), `usePrefersReducedMotion`, and `TypewriterText`.  
- **Props interface** (lines 13‑15): `LaunchBootProps` exposes `onExitComplete: () => void`.  
- **Component** (lines 17‑216):  
  - State: `step`, `progress`, `canSkip`; refs: `exitCalledRef`, `onExitRef`.  
  - `useEffect` chains progress through steps (`intro → title → tagline → subtitle → continue → hold → exit`) with timers, respecting reduced‑motion preference.  
  - Skip logic: after `LAUNCH_HOLD_SKIP_AFTER_MS` the user may press Enter/Space or click to trigger `beginExit`.  
  - `onExitComplete` is invoked once after the exit fade (`LAUNCH_EXIT_FADE_MS`).  
- **Render**: dialog with `role="dialog"`, `aria-modal="true"`, logo image, typewriter text for each step, progress bar, and a skip prompt that appears after the “continue” step.

### Impact  
- Adds a dedicated launch sequence component; no existing files are altered.  
- Encapsulates animation logic, simplifying future maintenance.  
- Introduces timers and state updates; startup performance impact is minimal.  
- Provides reduced‑motion support via `usePrefersReducedMotion` and accessible dialog attributes.

### Risks & follow‑ups  
- Verify `onExitComplete` is called exactly once; `exitCalledRef` prevents double calls.  
- Ensure all timers are cleared on unmount (cleanup functions are present in each `useEffect`).  
- Confirm skip behavior works for both keyboard (Enter/Space) and mouse click when `canSkip` is true.  
- Test reduced‑motion mode to ensure the animation is bypassed and the UI remains usable.
