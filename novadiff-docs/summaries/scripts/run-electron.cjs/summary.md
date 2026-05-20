### Overview  
A new script `scripts/run-electron.cjs` is added. It spawns the Electron binary from `node_modules/electron/dist/` instead of using `electron/cli.js`. The script resolves the binary path, cleans the environment, and starts the process with the supplied arguments.

### Key changes  
- **Imports** (R9‑R11): `fs`, `path`, and `spawn` from Node core modules; `augmentPathForCli` from `path.join(root, "electron", "gh-path.cjs")` (R18).  
- **`cleanEnv()`** (lines 17‑22): augments PATH via `augmentPathForCli`, removes `ELECTRON_OVERRIDE_DIST_PATH`, returns sanitized env.  
- **`resolveElectronBinary()`** (lines 24‑41): reads `path.txt` in the Electron package, validates existence of the binary, returns its full path. Throws if `path.txt` missing or empty, or binary not found.  
- **Process launch** (lines 49‑53): spawns the binary with `cwd: root`, `stdio: "inherit"`, and the cleaned env.  
- **Error handling** (lines 55‑66): logs child errors, exits with child’s exit code or forwards signals.

### Impact  
The script guarantees the binary used is the one bundled with the repo, avoiding overridden paths. Centralizes binary resolution logic; future changes to Electron layout can be made in one place. Errors are printed to stdout and the process exits with the child’s exit code, aiding debugging.

### Risks & follow‑ups  
- **Missing `path.txt`**: script throws if absent; ensure `npm install` populates it.  
- **Node version**: relies on `node:fs`, `node:path`, `node:child_process`; requires Node 18+.  
- **`augmentPathForCli` path**: script assumes `path.join(root, "electron", "gh-path.cjs")` exists and exports correctly; validate this dependency.  
- **Testing**: add unit tests for `resolveElectronBinary()` and `cleanEnv()` to cover edge cases such as empty `path.txt` or missing binary.
