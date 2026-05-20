### Overview  
`packages/graph-core/src/change-classifier.ts` adds a decision engine that classifies graph update types from a `ChangeAnalysis` (lines 1‑2). It exports an `UpdateDecision` interface (lines 4‑10) and a `classifyUpdate` function (lines 21‑86) that chooses among `SKIP`, `PARTIAL_UPDATE`, `ARCHITECTURE_UPDATE`, and `FULL_UPDATE`.

### Key changes  
- **Imports**: `dirname` from `node:path` and `ChangeAnalysis` from `./fingerprint.js` (lines 1‑2).  
- **`UpdateDecision`** (lines 4‑10): `action`, `filesToReanalyze`, `rerunArchitecture`, `rerunTour`, `reason`.  
- **`classifyUpdate`** (lines 21‑86):  
  - `SKIP` when `structuralCount === 0`.  
  - `FULL_UPDATE` if `structuralCount > 30` or `structuralCount / totalFilesInGraph > 0.5`.  
  - `ARCHITECTURE_UPDATE` when `detectDirectoryChanges` is true or `structuralCount > 10`.  
  - `PARTIAL_UPDATE` otherwise.  
- **Helpers**:  
  - `detectDirectoryChanges` (lines 94‑113) checks for new/deleted top‑level directories.  
  - `topDirectory` (lines 119‑124) returns the first path segment.  
  - `summarizeChanges` (lines 129‑143) builds a concise summary of new, deleted, and modified files.

### Impact  
- Centralizes update‑decision logic; thresholds are explicit in the source.  
- Decision logic is deterministic and documented in the comments.  
- The module is isolated; consumers must import `UpdateDecision` and `classifyUpdate` to use it.

### Risks & follow‑ups  
- `ChangeAnalysis` must correctly populate `structurallyChangedFiles`, `newFiles`, and `deletedFiles`; otherwise decisions may be wrong.  
- `rerunTour` is set to `false` for `SKIP` and `true` for other actions; confirm downstream expectations.  
- Edge cases (empty graph, 100 % structural changes, directory‑only changes) should be tested against the thresholds.  
- `topDirectory` uses POSIX `/` separators; handling of Windows paths is unknown from the diff.
