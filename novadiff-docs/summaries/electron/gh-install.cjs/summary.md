### Overview  
A new module `electron/gh-install.cjs` (lines 1‑196) adds runtime detection and optional installation of the GitHub CLI (`gh`). It replaces a manual install flow with platform‑specific logic.

### Key changes  
- **Imports**: `spawn` and `spawnSync` from `node:child_process` (R3‑R4) and `fssync` from `node:fs` (R4).  
- **Path helpers**: `augmentPathForCli`, `resolveGhExecutable`, `isGhInstalled`, `clearGhCache` required from `./gh-path.cjs` (R5‑R10).  
- **`resolveBrew`** (lines 15‑38) searches common Homebrew paths and falls back to `command -v brew`.  
- **`getInstallPlan`** (lines 40‑79) returns an install strategy per OS: Homebrew on macOS, winget on Windows, or a manual hint on other platforms.  
- **`readGhVersion`** (lines 81‑94) runs `gh --version` via `spawnSync` to report the installed version.  
- **`getGhToolingStatus`** (lines 96‑110) aggregates installation status, path, version, and install plan.  
- **`runInstallCommand`** (lines 116‑142) spawns the installer process, streams logs, and clears cache on completion.  
- **`installGh`** (lines 148‑190) orchestrates the auto‑install flow, validates success, and returns `{ok, path, version}`.  
- **Exports**: `GH_FEATURE_REASON`, `getGhToolingStatus`, `installGh` (lines 192‑196).

### Impact  
- Adds detection of `gh` and an automated install path, reducing manual setup.  
- Centralizes CLI logic in one module; functions are small and testable.  
- Uses `spawnSync` for quick checks; installation uses async `spawn`, keeping UI responsive.  
- Explicitly supports macOS (Homebrew) and Windows (winget); Linux falls back to manual instructions.

### Risks & follow‑ups  
- `spawnSync` may block startup; verify timeout handling on slow systems.  
- Linux users still need manual install; ensure the manual hint is clear.  
- `runInstallCommand` rejects on non‑zero exit; callers must handle this.  
- `clearGhCache` must correctly reset any cached `gh` state; run integration tests after installation.
