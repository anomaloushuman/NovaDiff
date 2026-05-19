### Overview  
A new test file `packages/graph-core/src/__tests__/search.test.ts` (lines R1‑R158) validates the `SearchEngine` implementation. It defines a helper `makeNode`, a sample node set, and a suite of unit tests covering query handling, ranking, scoring, node updates, type filtering, and result limits.

### Key changes  
- **Imports added**: `vitest` helpers and `SearchEngine` from `../search.js` (R1‑R3).  
- **`makeNode` helper** (R5‑R10) constructs `GraphNode` objects with defaults.  
- **Sample node array** (R13‑R57) includes diverse node types (file, class, function) and metadata (tags, summary).  
- **Test cases** (R59‑R158) cover:  
  - Empty query handling (R60‑R64).  
  - Exact and fuzzy name matching (R66‑R78).  
  - Field‑wide search (summary, tags) (R80‑R94).  
  - Ranking priority (R96‑R102).  
  - Score bounds (R104‑R112).  
  - Dynamic re‑indexing via `updateNodes` (R114‑R137).  
  - Type‑based filtering (R139‑R151).  
  - Result limiting (R153‑R157).

### Impact  
- **Correctness**: Provides high‑confidence coverage for core search logic; many tests will fail if the API or scoring logic changes.  
- **Maintainability**: Centralizes test data in `makeNode`, easing future test additions.  
- **Compatibility**: No API changes; purely test‑only, so runtime behavior remains unchanged.

### Risks & follow‑ups  
- **Regression risk**: Tests will fail if `SearchEngine` API or scoring logic changes.  
- **Test flakiness**: Fuzzy matching tests rely on internal scoring thresholds; confirm stability after algorithm tweaks.  
- **Coverage gaps**: Tests focus on positive paths; consider adding edge cases for malformed input or large node sets (unknown from the available diff/scan evidence).  
- **Performance impact**: unknown from the available diff/scan evidence.
