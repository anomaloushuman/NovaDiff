### Overview
A new file `src/app/launchSequence.ts` (added) introduces launch‑related constants, a `LaunchPhase` type, and two helper functions that persist launch state in `sessionStorage`.

### Key changes
- **Exports** (R1‑8, R10):  
  - `LAUNCH_SESSION_KEY`, `LAUNCH_HOLD_MS`, `LAUNCH_HOLD_SKIP_AFTER_MS`, `LAUNCH_EXIT_FADE_MS`, `LAUNCH_REVEAL_MS` (lines R1‑8).  
  - `LaunchPhase` type (line R10).  
  - `readLaunchSkipped()` and `markLaunchComplete()` (lines R12‑26).  
- **Behavior** (R12‑26):  
  - `readLaunchSkipped()` returns `true` when `sessionStorage.getItem(LAUNCH_SESSION_KEY) === "1"`, otherwise `false`.  
  - `markLaunchComplete()` stores `"1"` under `LAUNCH_SESSION_KEY`.  
  - Both functions wrap storage access in `try/catch` to avoid errors if `sessionStorage` is unavailable.

### Impact
- Centralizes launch constants and state logic, simplifying future updates.  
- Adds minimal runtime cost: only simple `sessionStorage` reads/writes.  
- Functions are safe in environments without `sessionStorage` (e.g., SSR) due to error handling.

### Risks & follow‑ups
- Unknown from the available diff/scan evidence whether all target browsers expose `sessionStorage`; fallback behavior is acceptable.  
- Verify that existing launch flow imports this module and uses the exported constants consistently.  
- Run lint, test, and production build pipelines to confirm the new file compiles without errors.  
- Update internal documentation to expose the new API.
