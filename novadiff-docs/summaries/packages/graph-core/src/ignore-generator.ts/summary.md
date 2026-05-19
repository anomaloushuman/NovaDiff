### Overview  
A new file `packages/graph-core/src/ignore-generator.ts` (added lines 1‑3) introduces a helper to generate a starter `.novadiffignore`. The exported function `generateStarterIgnoreFile(projectRoot: string)` (lines 61‑102) builds the file by collecting patterns from an existing `.gitignore`, detecting common directories, and suggesting generic test file patterns.

### Key changes  
- **Imports** – added `existsSync`, `readFileSync` from `node:fs` (R1), `join` from `node:path` (R2), and `DEFAULT_IGNORE_PATTERNS` from `./ignore-filter.js` (R3).  
- **Constants** – `HEADER` (R5‑7), `DETECTABLE_DIRS` (R15‑26), and `GENERIC_SUGGESTIONS` (R28‑32) define the file’s structure.  
- **Helper functions** –  
  - `parseGitignorePatterns(gitignorePath)` (lines 37‑44) reads a `.gitignore` and returns non‑comment, non‑blank lines.  
  - `isCoveredByDefaults(pattern)` (lines 50‑54) normalizes patterns and checks them against `DEFAULT_IGNORE_PATTERNS`.  
- **Exported API** – `generateStarterIgnoreFile(projectRoot)` (lines 61‑102) orchestrates three sections:  
  1. Patterns from `.gitignore` that are not already covered by defaults.  
  2. Detected directories from `DETECTABLE_DIRS`.  
  3. Generic test file patterns from `GENERIC_SUGGESTIONS`.  
  All suggestions are commented out (`# pattern`) and the function returns the joined string.

### Impact  
- Provides a deterministic starter ignore file, centralizing ignore logic.  
- Adds negligible runtime cost: a single read of `.gitignore` and a small directory scan.  
- No changes to existing public APIs; purely additive.

### Risks & follow‑ups  
- **DEFAULT_IGNORE_PATTERNS** – verify that the import path resolves and the array contains the expected defaults.  
- **Path resolution** – ensure `join(projectRoot, dir)` behaves correctly across OSes.  
- **Comment syntax** – confirm downstream tooling respects the `#`‑prefixed suggestions.  
- **Test coverage** – unit tests for `generateStarterIgnoreFile` would guard against regressions in pattern filtering and directory detection.
