### Overview  
Three new helper functions were added to `electron/git-service.cjs` to give callers finer control over staging:

* `stagePaths(repoRoot, paths)` – normalises a list of paths, runs `git add -- <paths>`, and returns `{ staged: N }`.  
* `unstagePaths(repoRoot, paths)` – runs `git reset HEAD -- <paths>` and returns `{ unstaged: N }`.  
* `stageDistrict(repoRoot, topDir, statusFiles?)` – filters the repository’s status files to those under `topDir` (or its sub‑directories) and delegates to `stagePaths`.  

The module export list was extended (lines 253‑255) to expose these utilities.

### Key changes  
* **`stagePaths`** – added at lines 142‑149.  
* **`unstagePaths`** – added at lines 152‑159.  
* **`stageDistrict`** – added at lines 162‑169.  
* Export list updated to include the three new functions (lines 253‑255).  
* No other logic was modified.

### Impact  
* **API surface** – callers can now stage or unstage specific files or a whole directory without affecting the rest of the working tree.  
* **Implementation** – each helper invokes a single `runGit` call, so the runtime cost is minimal compared to existing helpers.  
* **Compatibility** – existing consumers of `stageAll`, `commit`, `push`, etc. remain unchanged.

### Risks & follow‑ups  
* The behavior of `stageDistrict` when `topDir` is empty or malformed is not documented; the current logic may match many files.  
* `unstagePaths` propagates any `git` error; tests should cover failure scenarios.  
* Documentation or type definitions should be updated to expose the new helpers.  
* Run the full lint, test, and build suite to confirm no regressions in the new code paths.
