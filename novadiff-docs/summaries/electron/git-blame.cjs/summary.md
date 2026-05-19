### Overview  
`electron/git-blame.cjs` now supports blaming arbitrary Git refs via a new helper `blameFileAtRef`. The cache key and error payload were expanded to include the ref, and the module exports were updated.

### Key changes  
- Added `function blameFileAtRef(repoRoot, ref, relPath)` (lines 37‑78) that accepts a Git ref and returns `{ lineAuthors, owners, ref, relPath, error }`.  
- `blameFileOwnership` (lines 79‑81) now delegates to `blameFileAtRef` with `"HEAD"`.  
- Removed `cacheKey` (lines 8‑11); cache key now `${root}::${gitRef}::${safeRelPath}` (line 44).  
- `spawnSync` command now includes the ref argument before `--line-porcelain` (lines 50‑56).  
- Error objects now contain `ref`, `relPath`, and a trimmed `error` string (lines 59‑65).  
- Simplified type annotation for `blameCache` to `Map<string, object>` (line 5).  
- Updated exports to `{ blameFileOwnership, blameFileAtRef, parseBlamePorcelain }` (lines 79‑83).

### Impact  
- Enables blame queries on any commit, improving historical analysis.  
- Cache now differentiates by ref, preventing stale data across branches.  
- Error payload exposes `ref` and `relPath`, aiding debugging.

### Risks & follow‑ups  
- Existing callers of `blameFileOwnership` remain functional, but any direct use of the old cache key format will break.  
- Including ref in the key may increase cache entries; monitor memory usage.  
- Callers must handle the new `error` field; update error‑logging logic if necessary.  
- Add unit tests for `blameFileAtRef` with non‑HEAD refs to confirm cache isolation and error payload.
