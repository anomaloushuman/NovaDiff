### Overview
The `electron/knowledge-graph-runner.cjs` file was modified to refine project‑file traversal logic.

### Key changes
- `SKIP_DIRS` now contains `"venv"`, `".venv"`, and `".venv-main"` (added at R32‑R34).  
- In `walkProjectFiles`, the guard was updated to skip any entry whose name starts with `".venv"` in addition to the existing `SKIP_DIRS` check (added at R162‑R165).  
- The previous isolated guard `if (SKIP_DIRS.has(entry.name))` was removed (L159).  
- Exclusion logic for `"site-packages"` remains unchanged.

### Impact
- Virtual‑environment directories are no longer traversed, reducing unnecessary file processing during knowledge‑graph generation.  
- Existing exclusion logic for Python package directories is preserved.

### Risks & follow‑ups
- Verify that legitimate directories named `".venv"` are not unintentionally skipped.  
- Run the repository’s lint, test, and production build commands to confirm no regressions.
