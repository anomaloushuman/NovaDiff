### Overview
Adds a new synchronous Git blame helper module at `electron/git-blame.cjs`. The file introduces three exported functions: `parseBlamePorcelain`, `blameFileAtRef`, and `blameFileOwnership`. It also enables strict mode and a `Map` cache.

### Key changes
- **`parseBlamePorcelain(stdout)`** (added lines 8‑34) parses `git blame --line-porcelain` output into `lineAuthors` and a sorted `owners` array.  
- **`blameFileAtRef(repoRoot, ref, relPath)`** (added lines 37‑76) runs `git blame` via `spawnSync`, caches results in `blameCache`, and returns `{ lineAuthors, owners, ref, relPath, error }`.  
- **`blameFileOwnership(root, relPath)`** (added lines 79‑81) is a convenience wrapper for `HEAD`.  
- The module exports the three functions (line 83) and uses `require("node:child_process")` (line 3).

### Impact
- Provides a synchronous API for blame lookups; the call blocks the event loop.  
- Caching reduces repeated Git calls for the same `(root, ref, relPath)` key.  
- Errors are returned as a trimmed string (up to 300 chars).  
- The module is isolated; no existing code paths are modified.

### Risks & follow‑ups
- **Blocking**: `blameFileAtRef` uses `spawnSync`; ensure it is not invoked on UI threads.  
- **Security**: `relPath` is trimmed but not escaped; validate against command‑injection.  
- **Cache growth**: monitor memory usage; consider eviction if many unique keys accumulate.  
- **Testing**: add unit tests for `parseBlamePorcelain` and `blameFileAtRef` to cover empty output, errors, and typical use cases.
