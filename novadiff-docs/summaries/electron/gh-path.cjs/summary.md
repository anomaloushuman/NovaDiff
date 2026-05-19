### Overview  
A new module `electron/gh-path.cjs` is added to resolve the GitHub CLI executable. It introduces `"use strict"` and imports `fssync`, `os`, `path`, and `spawnSync`. The module caches the resolved path in `cachedGhPath`.

### Key changes  
- **Imports** added at lines 3‑6.  
- **`extraPathDirs`** (lines 15‑31) returns common bin directories: Homebrew, user‑bin, and a Windows‑specific `GitHub CLI` path.  
- **`augmentPathForCli`** (lines 38‑51) merges these dirs into the current `PATH`, deduplicating entries.  
- **`ghCandidatePaths`** (lines 53‑60) lists typical `gh` locations.  
- **`resolveViaLoginShell`** (lines 63‑90) runs `/bin/zsh` or `/bin/bash` with `-ilc`/`-lc` to locate `gh` on non‑Windows systems.  
- **`verifyGh`** (lines 92‑98) executes `gh --version` to confirm the binary.  
- **`resolveGhExecutable`** (lines 104‑138) orchestrates the search: checks cache, candidate paths, login shell, then `which`/`where`; caches the result and falls back to `"gh"` or `"gh.exe"`.  
- **`clearGhCache`** (lines 140‑142) resets the cache.  
- **`isGhInstalled`** (lines 144‑150) verifies installation status.  
- **`ghInstallHint`** (lines 152‑160) returns platform‑specific install guidance.  
- **`ghNotFoundError`** (lines 162‑164) creates an error containing the hint.  
- **Exports** (lines 166‑173) expose the public API.

### Impact  
- Centralizes gh resolution logic and caching, reducing repeated lookups.  
- Provides actionable install hints in error messages.

### Risks & follow‑ups  
- `augmentPathForCli` returns a new environment object; ensure it does not mutate the caller’s `process.env`.  
- `resolveViaLoginShell` depends on `/bin/zsh` or `/bin/bash`; if neither exists, the fallback must still locate `gh`.  
- Cached path may become stale if `gh` is installed or removed during a session; `clearGhCache` should be invoked accordingly.  
- Add unit tests for helpers, especially `ghCandidatePaths` and `ghInstallHint`, to guard against future changes.
