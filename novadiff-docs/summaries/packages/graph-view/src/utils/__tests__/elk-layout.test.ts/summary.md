### Overview  
A new test file `packages/graph-view/src/utils/__tests__/elk-layout.test.ts` (lines 1‑106) was added to exercise the layout utilities. The file imports `vitest` helpers (R1) and the functions under test: `applyElkLayout`, `repairElkInput`, and the type `ElkInput` (R2).

### Key changes  
- **`repairElkInput` tests**  
  - Auto‑corrects missing node dimensions (R5‑R13).  
  - Deduplicates duplicate child IDs and reports an `auto‑corrected` issue (R18‑R30).  
  - Drops orphan edges that reference nonexistent nodes, emitting a `dropped` issue (R32‑R43).  
  - Removes children with nonexistent parents, also emitting a `dropped` issue (R45‑R62).  
  - Enforces strict mode: throws on any issue (R64‑R71).  
- **`applyElkLayout` tests**  
  - Lays out a small graph and verifies numeric positions (R74‑R90).  
  - Handles ELK rejection when `strict: false`, emitting a `fatal` issue (R93‑R104).

### Impact  
- **Correctness** – The tests confirm that `repairElkInput` cleans input data and that `applyElkLayout` returns positions or appropriate diagnostics.  
- **Observability** – The `issues` array now provides richer diagnostics for downstream consumers.  
- **Compatibility** – Tests depend on the current ELK API; any breaking change in ELK will surface here.  
- **Maintainability** – Adds a safety net for future refactors of the layout utilities.

### Risks & follow‑ups  
- **Regression risk** – If `repairElkInput` logic changes, several tests may fail; run the suite after any refactor.  
- **ELK dependency** – Ensure the ELK binary is available in CI; otherwise, tests will skip or fail.  
- **Strict mode behavior** – Confirm that `strict: true` still throws on all issue types, not just dimensions (unknown from the available diff/scan evidence).
