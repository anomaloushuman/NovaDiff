### Overview  
`src/app/launchSequence.ts` is a new module that centralizes launch‑flow constants and helper functions. It exposes a skip flag stored in `sessionStorage` and a `LaunchPhase` type for the boot, reveal, and ready stages.

### Key changes  
- **Constants**  
  - `LAUNCH_SESSION_KEY` (R1) = `"novadiff-launch-done-v1"` – identifies the skip flag.  
  - `LAUNCH_HOLD_MS` (R4) = 2400 ms – minimum time on the finished boot screen.  
  - `LAUNCH_HOLD_SKIP_AFTER_MS` (R6) = 900 ms – earliest moment the user can skip the hold.  
  - `LAUNCH_EXIT_FADE_MS` (R7) = 580 ms – fade duration when exiting the launch screen.  
  - `LAUNCH_REVEAL_MS` (R8) = 1200 ms – reveal animation duration.  
- **Type**  
  - `LaunchPhase` (R10) – `"boot" | "reveal" | "ready"`.  
- **Functions**  
  - `readLaunchSkipped()` (R12‑R18) reads the flag from `sessionStorage`, returning `false` on error.  
  - `markLaunchComplete()` (R20‑R26) writes `"1"` to `sessionStorage`, wrapped in a try/catch.

All symbols are exported for use by other parts of the application.

### Impact  
- Centralizes launch‑related logic, reducing duplication across UI components.  
- Safe access to `sessionStorage` prevents crashes on browsers that may throw.  
- Timing constants can be tuned without modifying UI code.  
- No external dependencies are introduced.

### Risks & follow‑ups  
- **SessionStorage availability**: unknown from the available diff/scan evidence.  
- **Race conditions**: unknown from the available diff/scan evidence.  
- Unit tests for `readLaunchSkipped()` and `markLaunchComplete()` are recommended to cover error paths.
