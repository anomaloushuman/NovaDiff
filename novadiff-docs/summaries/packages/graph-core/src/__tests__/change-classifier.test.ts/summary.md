### Overview  
A new test file `packages/graph-core/src/__tests__/change-classifier.test.ts` (lines 1‑183) was added. It imports `vitest` helpers, `classifyUpdate`, and the `ChangeAnalysis` type, and defines a `makeAnalysis` helper (R5‑13) that builds a `ChangeAnalysis` object with empty arrays by default.

### Key changes  
- **Imports**: `vitest` functions, `classifyUpdate`, and `ChangeAnalysis` (R1‑R3).  
- **Helper**: `makeAnalysis(overrides?)` returns a `ChangeAnalysis` with default empty arrays and merges any overrides (R5‑R13).  
- **Test cases** (R17‑R183) exercise the decision logic of `classifyUpdate`:
  - SKIP when all files are unchanged or only cosmetic (R18‑R40).  
  - PARTIAL_UPDATE for a few structural changes plus new files (R42‑R57).  
  - ARCHITECTURE_UPDATE when >10 structural files, new/deleted directories, or >50 % of the project is structurally changed (R59‑R96, R124‑R135, R137‑R147).  
  - FULL_UPDATE for >30 structural files or >50 % of the project (R124‑R135, R137‑R147).  
  - `filesToReanalyze` includes structural and new files but excludes deleted ones (R149‑R162).  
  - Empty analysis yields SKIP with a “No changes detected” reason (R164‑R170).  
  - Deleted files count toward the structural total (R172‑R182).

### Impact  
- Adds explicit unit tests for all decision branches of `classifyUpdate`.  
- The helper keeps test code concise; changes to the `ChangeAnalysis` shape require minimal updates.  
- Test failures will pinpoint the specific decision path that diverges from the expected behavior.

### Risks & follow‑ups  
- Threshold values (10‑file, 30‑file, 50 %) are hard‑coded in the tests; if the implementation changes, the tests will fail.  
- The logic that determines whether a new file is in a genuinely new directory relies on the `allKnownFiles` list; ensure this list remains accurate.  
- No performance regressions are expected, but additional scenarios could increase CI runtime.
