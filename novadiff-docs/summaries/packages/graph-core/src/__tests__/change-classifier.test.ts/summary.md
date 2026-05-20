### Overview  
A new test file `packages/graph-core/src/__tests__/change-classifier.test.ts` (lines 1‑183) was added to exercise the `classifyUpdate` decision logic.

### Key changes  
- **Imports** – `vitest` helpers, `classifyUpdate`, and the `ChangeAnalysis` type are imported at lines 1‑3.  
- **Helper** – `makeAnalysis` (lines 5‑14) builds a `ChangeAnalysis` object with default empty arrays, allowing concise test setups.  
- **Test cases** – The suite (lines 17‑183) covers all decision paths:
  - `SKIP` when all files are unchanged (lines 18‑28) or cosmetic‑only (lines 31‑40).  
  - `PARTIAL_UPDATE` for a few structural changes plus new files (lines 42‑57).  
  - `ARCHITECTURE_UPDATE` when >10 structural files (lines 59‑70), new/deleted directories (lines 72‑96), or when deleted files raise the structural count (lines 172‑182).  
  - `FULL_UPDATE` when >30 structural files (lines 124‑135) or >50 % of the project is structurally changed (lines 137‑147).  
  - File‑to‑reanalyze logic ensures new and structural files are included while deleted files are excluded (lines 149‑162).  
  - Edge cases: empty analysis (lines 164‑170) and counting deleted files toward structural totals (lines 172‑182).

### Impact  
- **Correctness** – the tests assert the expected actions for each threshold boundary, providing immediate feedback if the logic changes.  
- **Maintainability** – the `makeAnalysis` helper reduces duplication and keeps the test code focused on behavior.  
- **Observability** – failures surface directly in the test suite, making regressions easy to spot.

### Risks & follow‑ups  
- **Threshold drift** – if the thresholds in `classifyUpdate` are modified, the corresponding tests will fail; review and adjust expectations accordingly.  
- **Test discovery** – ensure `vitest` is configured to locate the new test file.
