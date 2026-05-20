### Overview  
A new module `electron/gh-path.cjs` is added. It supplies helpers to locate the GitHub CLI binary, augment the PATH for GUI‑app contexts, and generate platform‑specific install hints.

### Key changes  
- **`augmentPathForCli`** (lines 38‑51): builds a new environment object that merges Homebrew/user bin directories; it does not modify `process.env`.  
- **`extraPathDirs`** (lines 15‑31): lists common binary locations, including Windows `LOCALAPPDATA`.  
- **`ghCandidatePaths`** (lines 53‑60): enumerates typical `gh` install locations.  
- **`resolveViaLoginShell`** (lines 63‑90): runs `/bin/zsh` or `/bin/bash` with `-ilc` / `-lc` to execute `command -v gh`; returns the path if found.  
- **`resolveGhExecutable`** (lines 104‑138): performs a multi‑step lookup—cache, candidate paths, login shell, `which/where`, then defaults to `"gh"` or `"gh.exe"`. Uses `cachedGhPath` to avoid repeated `spawnSync`.  
- **`verifyGh`** (lines 92‑99): runs `gh --version` to confirm the binary works.  
- **`ghInstallHint`** (lines 152‑160) and **`ghNotFoundError`** (lines 162‑164): provide platform‑specific guidance.  
- The module exports all helpers (lines 166‑173).

### Impact  
- Centralizes path logic for macOS, Windows, and Linux; functions are small, exported, and testable.  
- Caching reduces repeated synchronous child‑process calls.  
- Explicit handling of Windows (`where`, `gh.exe`) and macOS Homebrew paths.  
- Errors include install hints, improving user experience.

### Risks & follow‑ups  
- `spawnSync` calls block startup; verify latency on all target platforms.  
- `resolveViaLoginShell` assumes `/bin/zsh` or `/bin/bash` exist; test on minimal images or custom macOS setups.  
- If `gh` is installed/uninstalled after app start, `clearGhCache` must be called; ensure callers invoke it.  
- `augmentPathForCli` merges directories but does not alter global `process.env`; downstream modules must use the returned environment.
