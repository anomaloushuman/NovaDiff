### Overview  
`src/app/launchSequence.ts` is a new module that exports constants and helper functions for tracking whether the app’s launch sequence has finished. The file adds lines 1‑8 (constants), line 10 (type), lines 12‑18 (`readLaunchSkipped`), and lines 20‑26 (`markLaunchComplete`).

### Key changes  
- **Constants**  
  - `LAUNCH_SESSION_KEY = "novadiff-launch-done-v1"` (R1) – key used in `sessionStorage`.  
  - `LAUNCH_HOLD_MS = 2400` (R4) – minimum display time on the finished boot screen.  
  - `LAUNCH_HOLD_SKIP_AFTER_MS = 900` (R6) – earliest point the user may skip the hold.  
  - `LAUNCH_EXIT_FADE_MS = 580` (R7) – fade‑out duration.  
  - `LAUNCH_REVEAL_MS = 1200` (R8) – reveal animation duration.  
- **Type**  
  - `LaunchPhase = "boot" | "reveal" | "ready"` (R10).  
- **Functions**  
  - `readLaunchSkipped()` (R12‑R18) reads the flag from `sessionStorage`, returning `true` if the key equals `"1"`. Errors are caught and `false` is returned.  
  - `markLaunchComplete()` (R20‑R26) writes `"1"` to `sessionStorage` under the key, with a silent catch for storage errors.

### Impact  
- Provides a single source of truth for launch completion that survives page reloads.  
- Centralizes timing constants, simplifying future adjustments.  
- Uses `sessionStorage`; if unavailable (e.g., in privacy‑mode browsers), the try/catch prevents crashes but silently ignores failures.

### Risks & follow‑ups  
- **Storage availability** – verify that `sessionStorage` is accessible in all target environments; consider a fallback if it is blocked.  
- **Silent error handling** – the catch blocks swallow errors; adding diagnostics could surface hidden issues.  
- **Dead code** – the module’s exports are not referenced elsewhere in the diff; ensure they are imported where needed.  
- **Testing** – no unit tests cover this module; tests should confirm flag persistence and error handling.
