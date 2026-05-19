### Overview  
A new component `src/components/launch/AppLaunchShell.tsx` (lines 1‑76) is added. It implements a launch sequence state machine, reduced‑motion handling, and exposes a context for downstream components.

### Key changes  
- **Exports**  
  - `AppLaunchShellProps` (optional `chrome`, required `children`, optional `onPhaseChange`) – added at lines 13‑18.  
  - `AppLaunchShell` function – added at line 19.  
- **Imports** – added at lines 1‑11:  
  - React hooks (`useCallback`, `useEffect`, `useMemo`, `useState`).  
  - `LAUNCH_REVEAL_MS`, `LaunchPhase`, `markLaunchComplete`, `readLaunchSkipped` from `../../app/launchSequence`.  
  - `usePrefersReducedMotion` from `../../app/usePrefersReducedMotion`.  
  - `LaunchProvider` from `./LaunchContext`.  
  - `LaunchBoot` from `./LaunchBoot`.  
  - CSS from `./launch.css`.  
- **State logic** –  
  - `skipSequence` is `true` when reduced motion is preferred or `readLaunchSkipped()` returns true.  
  - Initial `phase` is `"ready"` if skipping, otherwise `"boot"`.  
  - `bootVisible` tracks whether the boot UI should be shown.  
- **Callbacks & effects** –  
  - `onBootExitComplete` sets `bootVisible` to false, moves to `"reveal"`, and calls `markLaunchComplete()`.  
  - An effect transitions from `"reveal"` to `"ready"` after `LAUNCH_REVEAL_MS`.  
  - Another effect calls `onPhaseChange` whenever `phase` changes.  
- **Context** – `LaunchProvider` supplies `{ phase, skipSequence, brandReveal }` where `brandReveal` is true for `"reveal"` or `"ready"`.  
- **Rendering** – Conditionally shows `LaunchBoot`, an optional chrome panel with motion classes, and the children wrapped in a shell div.

### Impact  
- Adds a launch flow that can skip the boot sequence when reduced motion is enabled or previously skipped.  
- Downstream consumers receive `skipSequence` and `brandReveal` in addition to `phase`.  
- New CSS classes (`is-launched`, `is-revealing`, `is-ready`) drive visual transitions.  
- `markLaunchComplete()` is invoked after boot exit, setting the launch completion flag.

### Risks & follow‑ups  
- Verify that `LAUNCH_REVEAL_MS`, `LaunchPhase`, `markLaunchComplete`, and `readLaunchSkipped` are exported from `launchSequence`.  
- Ensure `LaunchBoot` accepts an `onExitComplete` prop; otherwise a runtime error will occur.  
- Test that `skipSequence` correctly bypasses the boot UI and sets the phase to `"ready"`.  
- Confirm that existing `LaunchContext` consumers handle the new `brandReveal` flag without breaking.  
- Run the repo’s lint, test, and production build scripts to catch any type or runtime issues.
