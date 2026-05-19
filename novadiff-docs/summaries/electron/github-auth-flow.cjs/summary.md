### Overview  
A new module `electron/github-auth-flow.cjs` (lines 1‑141) implements a GitHub CLI device‑code authentication flow. It exports `startGithubDeviceAuth`, `cancelGithubDeviceAuth`, and the constant `VERIFICATION_URI`.

### Key changes  
- **Imports (lines 3‑10)**:  
  - `spawn` from `node:child_process`  
  - `shell` from `electron`  
  - `augmentPathForCli`, `resolveGhExecutable`, `isGhInstalled`, `ghNotFoundError` from `./gh-path.cjs`  
- **Utility (lines 17‑20)**: `stripAnsi` removes ANSI escape codes from CLI output.  
- **Cancellation (lines 21‑37)**: `cancelGithubDeviceAuth` terminates any active `gh` child process (`child.kill("SIGTERM")` at line 26) and clears `activeLogin`.  
- **Auth flow (lines 38‑141)**:  
  - Checks `gh` presence (`isGhInstalled()` at line 41).  
  - Spawns `gh auth login` with device‑code flags (lines 51‑58).  
  - Parses output for a 4‑segment code using `CODE_RE` (line 13).  
  - Emits progress events (`code`, `complete`, `error`) via the supplied `emit` callback.  
  - Opens the verification URL (`shell.openExternal(VERIFICATION_URI)` at line 95).  
  - Handles a 90 s timeout (lines 73‑77) and child process errors (lines 106‑113).  
  - On child close, emits `complete` or an error based on exit code (lines 115‑131).  
- **Exports (lines 137‑141)**: `startGithubDeviceAuth`, `cancelGithubDeviceAuth`, `VERIFICATION_URI`.

### Impact  
- **Correctness**: Provides a clear, event‑driven device‑auth path that relies on `gh` being installed.  
- **Maintainability**: Centralizes CLI path handling and error messaging; future flag changes can be made in one place.  
- **Performance**: Minor overhead from spawning a child process; timeout is 90 s.  
- **Compatibility**: Requires Electron’s `shell` API; not usable in non‑Electron contexts.  
- **Observability**: Emits detailed phases (`code`, `complete`, `error`) that can be logged or surfaced to the renderer.

### Risks & follow‑ups  
- **Regression risk**: Run session‑regression tests targeting `startGithubDeviceAuth`.  
- **CLI availability**: Verify `ghNotFoundError` surfaces correctly when `gh` is missing.  
- **Lint & build**: Execute `npm run lint`, `npm test`, and the production build to catch syntax or type issues.  
- **Shell integration**: Confirm `shell.openExternal` opens the correct URL on all supported platforms.
