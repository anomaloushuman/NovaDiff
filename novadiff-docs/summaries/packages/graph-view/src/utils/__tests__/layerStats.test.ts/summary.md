### Overview  
A new test file `packages/graph-view/src/utils/__tests__/layerStats.test.ts` was added. It imports `vitest`, `computeLayerStats`, and the `GraphNode`/`Layer` types (R1‑R3). Helper constructors `node`, `layer`, and `indexById` are defined (R5‑R30). The file contains a `describe` block with several `it` tests (R32‑R118).

### Key changes  
- **Imports**: `vitest`, `computeLayerStats`, and type imports added (R1‑R3).  
- **Helpers**:  
  - `node` creates a `GraphNode` (R5‑R17).  
  - `layer` creates a `Layer` (R19‑R26).  
  - `indexById` builds a `Map<string, GraphNode>` (R28‑R30).  
- **Test cases**:  
  - Resolved node counting only existing nodes (R32‑R38).  
  - Complexity aggregation thresholds at 30 % for `simple`, `complex`, and `moderate` (R40‑R86).  
  - Preference of `complex` over `moderate` when both exceed the threshold (R64‑R75).  
  - Empty layer treated as `simple` with `resolvedCount` = 0 (R88‑R92).  
  - Performance guard: 100 layers × 100 nodes, execution under 50 ms (R94‑R118).

### Impact  
- Provides unit coverage for `computeLayerStats`, ensuring correct filtering and aggregation logic.  
- Adds a regression guard for algorithmic complexity, comparing the new O(N + ΣKᵢ) path against the previous O(N×K×L) approach.  
- Centralizes test helpers, reducing duplication across tests.

### Risks & follow‑ups  
- The performance test depends on `performance.now()`; CI hardware variability could cause flakiness.  
- If `computeLayerStats` is refactored, these tests may fail; review threshold logic to keep it consistent.  
- The 30 % threshold is hard‑coded in the tests; confirm that this value is documented and not changed elsewhere.
