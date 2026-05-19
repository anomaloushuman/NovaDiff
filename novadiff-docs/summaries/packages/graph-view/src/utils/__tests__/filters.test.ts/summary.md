### Overview  
A new test file `packages/graph-view/src/utils/__tests__/filters.test.ts` (diff lines R1‑196) has been added. It imports `filterNodes` and `filterEdges` from `../filters` and type definitions from `@novadiff/graph-core/types` and `../../store` (lines 1‑18).

### Key changes  
- Local helper constructors `node`, `edge`, `defaultFilters`, and `indexLayers` are defined (lines 20‑62) to generate deterministic test data.  
- Node‑filter tests (lines 64‑124) assert:  
  - all nodes returned when no filters are applied,  
  - filtering by node type, complexity, and layer inclusion,  
  - handling of orphan nodes and multi‑layer precedence,  
  - ignoring the layer filter when none are selected.  
- A performance guard (lines 137‑162) verifies that filtering 10 k nodes across 100 layers completes in < 50 ms, guarding against O(N×L×K) regressions.  
- Edge‑filter tests (lines 165‑196) confirm:  
  - visibility filtering,  
  - edge‑category filtering,  
  - preservation of unknown edge types.

### Impact  
- The suite now covers edge cases for node and edge filtering logic, providing immediate CI feedback on regressions.  
- The timing benchmark ensures linear scaling of `filterNodes` in future refactors.  
- Local helpers keep the tests self‑contained, avoiding external dependencies.

### Risks & follow‑ups  
- The timing test may be flaky on heavily loaded CI runners; consider adding a tolerance or environment guard.  
- If filter implementations change, expectations may need updating; run `vitest --update` to refresh.  
- Ensure `getEdgeCategory` remains stable; unknown types should still pass through as asserted.  
- Verify that `indexLayers` correctly maps nodes to multiple layers; any change in layer structure could break the multi‑layer test.
