### Overview  
A new module `electron/gh-install.cjs` (lines 1‑196) is added to the Electron build. It implements runtime detection, installation, and status reporting for the GitHub CLI (`gh`) on macOS, Windows, and Linux.

### Key changes  
- **Imports** – `spawn`/`spawnSync` from `node:child_process` and `fssync` from `node:fs` are added (R3, R4, R24, R85).  
- **`resolveBrew()`** (lines 15‑38) checks known Homebrew paths or runs `command -v brew`.  
- **`getInstallPlan()`** (lines 40‑79) returns an object with `canAutoInstall`, `method`, `command`, and URLs, tailored per platform.  
- **`readGhVersion()`** (lines 81‑94) runs `gh --version` via `spawnSync` to capture the installed version.  
- **`getGhToolingStatus()`** (lines 96‑110) aggregates installation status, path, version, and plan details.  
- **`runInstallCommand()`** (lines 116‑142) spawns the install command, streams output to an optional logger, and clears the gh cache on completion.  
- **`installGh()`** (lines 148‑190) orchestrates the installation flow, validates success, and returns the installed path and version.  
- **Exports** (lines 192‑196) expose `GH_FEATURE_REASON`, `getGhToolingStatus`, and `installGh`.

### Impact  
- **Deterministic checks** – `spawnSync` is used for quick existence and version queries, reducing nondeterminism.  
- **Centralized logic** – All CLI tooling concerns live in one module; adding a new platform only requires extending `getInstallPlan()`.  
- **Responsive UI** – `runInstallCommand()` is async, keeping the Electron UI responsive during installs.  
- **Explicit URLs** – Manual install hints point to `https://cli.github.com/` and platform‑specific resources.  
- **Logging** – Optional `onLog` streams install output, aiding debugging.

### Risks & follow‑ups  
- **Homebrew detection** – `resolveBrew()` relies on known paths and `command -v brew`; verify it finds Homebrew on all supported macOS variants.  
- **Cache invalidation** – `clearGhCache()` is called before and after installs; missing it could leave stale state.  
- **Permission handling** – Homebrew or winget installs may require elevated privileges; test error paths.  
- **Linux support** – No auto‑install is offered; confirm `isGhInstalled()` correctly reports absence.
