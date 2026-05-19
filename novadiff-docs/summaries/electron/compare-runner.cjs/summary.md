### Overview  
`electron/compare-runner.cjs` now includes a non‑blocking compare engine runner with progress reporting. The module exports were expanded to expose `runCompareEngineAsync`, and a helper `parseEngineStdout` was added. The import statement was updated to bring in `spawn` alongside `spawnSync` (L5).

### Key changes  
- **Import update** – `const { spawn, spawnSync } = require("node:child_process");` (L5).  
- **New helper** – `parseEngineStdout(stdout)` validates output and parses JSON (L89‑98).  
- **Async runner** – `runCompareEngineAsync(appRoot, message, isPackaged, onProgress)` spawns the engine, streams stdout/stderr, emits heartbeat progress, and parses results asynchronously (L104‑210).  
- **Exports** – module now exports `runCompareEngine`, `runCompareEngineAsync`, and `resolveRustCli` (L212‑216).  
- **Removed** – old `module.exports = { runCompareEngine, resolveRustCli };` (L89).

### Impact  
- **Responsiveness** – UI stays responsive during long compare runs; progress events (`spawn`, `running`, `parsing`, `done`) are emitted.  
- **Error handling** – `parseEngineStdout` throws early on empty or invalid output, improving diagnostics.  
- **Compatibility** – Existing sync usage (`runCompareEngine`) remains unchanged; new async API requires callers to handle a Promise and optional `onProgress`.  
- **Performance** – Heartbeat interval (450 ms) and byte‑count tracking may add minor overhead but provide useful feedback.  
- **Maintainability** – Centralized stdout parsing reduces duplication; exports are clearer.

### Risks & follow‑ups  
- **API breakage** – Code importing the old export shape may fail; update imports to the new object.  
- **Progress callback** – `onProgress` is optional; callers should guard against `undefined`.  
- **Child process cleanup** – Verify that `child` is terminated on error or timeout to avoid orphaned processes.  
- **Encoding assumptions** – `stdout` is treated as UTF‑8; confirm that all engine outputs conform.  
- **Testing** – Add unit tests for `runCompareEngineAsync` covering success, error, and progress emission.
