### Overview  
A new test file `packages/graph-view/src/utils/__tests__/containers.test.ts` (lines 1‑131) has been added. It imports `vitest` helpers, the `deriveContainers` function, and `GraphNode`/`GraphEdge` types.

### Key changes  
- **Imports** added at lines 1‑3.  
- **Helper** `node(id, filePath?)` defined lines 5‑14 to create minimal `GraphNode` objects.  
- **Folder‑strategy tests** (`describe` block starting line 17) cover:  
  * grouping by first folder segment (lines 18‑24),  
  * stripping longest common prefix (lines 35‑43),  
  * collapsing nested folders into the first segment (lines 45‑53),  
  * placing nodes without `filePath` into a `"~"` container (lines 55‑64),  
  * suppressing single‑child containers (lines 66‑78),  
  * returning a flat list when total nodes < 8 (lines 80‑89).  
- **Community‑fallback tests** (`describe` block starting line 92) cover:  
  * fallback to community clustering when only one folder exists (lines 93‑115),  
  * fallback when one folder holds > 70 % of nodes (lines 117‑130).  
- **Synthetic edges** are built (lines 98‑108) to trigger community detection logic.

### Impact  
- Adds coverage for edge cases in `deriveContainers`; no production code is modified.  
- Centralizes node creation via the `node` helper, simplifying future test additions.

### Risks & follow‑ups  
- Test ordering may affect deterministic results; `containers.map(...).sort()` is used in several assertions (lines 28‑29, 52, 63, 75, 88).  
- Snapshot drift is unknown from the diff; run `vitest --update` if failures occur.  
- CI integration is unknown; verify that the new file is picked up by the existing test runner.
