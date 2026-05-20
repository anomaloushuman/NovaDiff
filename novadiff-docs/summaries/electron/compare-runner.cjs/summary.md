### Overview  
A new file `electron/compare-runner.cjs` (added lines 1‑216) introduces a module that wraps a Rust‑based compare engine. It discovers the binary, sanitises the environment, and offers both synchronous and asynchronous execution paths.

### Key changes  
- **Imports** (added lines 3‑5):  
  ```js
  const fs = require("node:fs");
  const path = require("node:path");
  const { spawn, spawnSync } = require("node:child_process");
  ```
- **`cliExecutableName()`** (lines 7‑8): returns `"novadiff-cli"` or `"novadiff-cli.exe"` based on `process.platform`.
- **`resolveRustCli(appRoot, isPackaged)`** (lines 15‑39): searches for the binary in `process.env.NOVADIFF_CLI`, packaged resources, and dev build directories, returning the path or `null`.
- **`cleanEnv()`** (lines 42‑46): clones `process.env` and removes `ELECTRON_OVERRIDE_DIST_PATH` and `ELECTRON_RUN_AS_NODE`.
- **`runCompareEngine()`** (lines 54‑87): spawns the binary synchronously with `spawnSync`, checks exit status, parses JSON output, and throws detailed errors.
- **`parseEngineStdout(stdout)`** (lines 89‑97): safely parses stdout into JSON, throwing on failure.
- **`runCompareEngineAsync()`** (lines 104‑209): spawns the binary asynchronously, streams stdout/stderr, emits heartbeat progress events every 450 ms, and resolves with parsed JSON or rejects on error.
- **Exports** (lines 212‑216): `runCompareEngine`, `runCompareEngineAsync`, `resolveRustCli`.

### Impact  
- **Robustness**: Centralised binary resolution and error handling reduce the chance of silent failures.  
- **Responsiveness**: The async wrapper keeps Electron IPC responsive while the engine runs.  
- **Cross‑platform**: Handles Windows (`.exe`) and POSIX binaries, and supports both packaged and development builds.

### Risks & follow‑ups  
- **Binary discovery**: Verify `resolveRustCli` locates the correct binary in all target environments (dev, packaged, CI).  
- **Environment sanitisation**: Ensure `cleanEnv` does not strip variables required by the Rust binary.  
- **Async progress**: Test that `onProgress` callbacks receive accurate `bytesReceived` and elapsed time, especially for large payloads.  
- **Error paths**: Confirm that all thrown errors surface correctly in the UI; stack traces are informative.
