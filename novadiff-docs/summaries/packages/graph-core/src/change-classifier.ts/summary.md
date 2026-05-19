### Overview  
A new file `packages/graph-core/src/change-classifier.ts` introduces a comprehensive update‑decision engine for graph rebuilds, replacing the previous ad‑hoc logic.

### Key changes  
- **New `UpdateDecision` interface** (lines 4‑10) defines `action`, `filesToReanalyze`, `rerunArchitecture`, `rerunTour`, and `reason`.  
- **`classifyUpdate` function** (lines 21‑86) now evaluates structural changes, file counts, and directory shifts to return an `UpdateDecision`.  
- **Directory‑aware detection** via `detectDirectoryChanges` (lines 94‑113) and `topDirectory` (lines 119‑124) checks for new or removed top‑level directories.  
- **Human‑readable summary** produced by `summarizeChanges` (lines 129‑143) for logging and diagnostics.  
- Added imports: `dirname` from `node:path` and a type import for `ChangeAnalysis` (lines 1‑2).  

### Impact  
- **Correctness**: Explicit decision matrix reduces ambiguous rebuild triggers; thresholds for full vs. partial updates are now deterministic.  
- **Maintainability**: Centralized decision logic in a single module simplifies future rule tweaks and unit testing.  
- **Observability**: `reason` strings provide clear audit trails for why a rebuild was chosen.  
- **Compatibility**: No API changes to existing callers; the new module is self‑contained and only adds exports.  

### Risks & follow‑ups  
- **Regression risk**: Verify that existing build pipelines still trigger the expected actions; unit tests for `classifyUpdate` should cover edge cases (e.g., >30 structural files).  
- **Performance**: `detectDirectoryChanges` iterates over all known files; benchmark on large projects to ensure no slowdown.  
- **Type safety**: Ensure `ChangeAnalysis` type aligns with callers; missing fields could cause runtime errors.  
- **Documentation**: Update README or internal docs to explain the new decision matrix and thresholds.
