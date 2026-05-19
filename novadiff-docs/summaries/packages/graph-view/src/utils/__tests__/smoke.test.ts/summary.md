### Overview
A smoke‑test file was added to `packages/graph-view/src/utils/__tests__/smoke.test.ts` (lines R1‑R21).  
It verifies that the bundled dependencies `elkjs`, `graphology`, and `graphology-communities-louvain` can be imported and used.

### Key changes
- **File added**: `packages/graph-view/src/utils/__tests__/smoke.test.ts` (R1‑R21).  
- **Imports** (R1‑R4):
  - `describe, it, expect` from `vitest`.  
  - `Graph` from `graphology`.  
  - `louvain` from `graphology-communities-louvain`.  
  - `loadElkConstructor` from `../elk-bundled`.  
- **Test suite** `dependency smoke test` (R6‑R21):
  - `imports elkjs`: loads ELK asynchronously and asserts it is a function.  
  - `imports graphology`: creates a `Graph`, adds a node, and checks `order === 1`.  
  - `imports graphology-communities-louvain`: asserts `louvain` is a function.

### Impact
- Adds early CI checks for missing or broken imports; no production code changes.  
- Increases test coverage by ~21 lines with negligible runtime overhead.  
- Confirms that `loadElkConstructor` resolves asynchronously and returns a usable constructor.

### Risks & follow‑ups
- If `loadElkConstructor` throws, the test will error; ensure the ELK bundle is available.  
- The test requires `vitest`, `graphology`, and `graphology-communities-louvain` to be installed; missing packages will cause failures.  
- If any dependency API changes (e.g., `Graph.order`), the test will need updating.
