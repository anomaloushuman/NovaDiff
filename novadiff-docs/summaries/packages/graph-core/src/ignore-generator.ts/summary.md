### Overview  
A new file `packages/graph-core/src/ignore-generator.ts` (lines 1‑102) adds a helper that builds a starter `.novadiffignore`. It pulls patterns from an existing `.gitignore`, detects common directories, and lists generic test‑file globs, all commented out for optional activation.

### Key changes  
- **Imports** (R1‑R3):  
  ```ts
  import { existsSync, readFileSync } from "node:fs";
  import { join } from "node:path";
  import { DEFAULT_IGNORE_PATTERNS } from "./ignore-filter.js";
  ```
- **Constants** (R5‑R13, R15‑R26, R28‑R32):  
  - `HEADER` – explanatory comment block.  
  - `DETECTABLE_DIRS` – array of common test/fixture directories.  
  - `GENERIC_SUGGESTIONS` – glob patterns for test files.
- **Helpers** (R37‑R44, R50‑R54):  
  - `parseGitignorePatterns(gitignorePath)` – returns non‑comment, non‑blank patterns.  
  - `isCoveredByDefaults(pattern)` – checks if a pattern is already in `DEFAULT_IGNORE_PATTERNS` (normalizes trailing slashes).
- **Exported API** (R61‑R102):  
  `generateStarterIgnoreFile(projectRoot)` concatenates sections for `.gitignore` patterns, detected directories, and generic test patterns, returning the file content.

### Impact  
- Provides a deterministic starter ignore file that respects existing defaults and the project’s structure.  
- Centralizes ignore‑generation logic; future tweaks can be made in one place.  
- Reads only the `.gitignore` and checks a small set of directories, so runtime overhead is minimal.

### Risks & follow‑ups  
- **Default coverage**: `isCoveredByDefaults` normalizes trailing slashes; verify that all default patterns are correctly matched to avoid duplicates.  
- **Path resolution**: `join(projectRoot, dir)` must work on both Windows and POSIX; test with mixed‑case directories.  
- **Documentation**: expose `generateStarterIgnoreFile` in user docs if intended for public use.  
- **Testing**: add unit tests for `parseGitignorePatterns` and `generateStarterIgnoreFile` to cover edge cases (empty `.gitignore`, nested directories).
