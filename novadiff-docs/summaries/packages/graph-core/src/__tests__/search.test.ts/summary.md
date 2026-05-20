### Overview  
A new test file `packages/graph-core/src/__tests__/search.test.ts` (lines R1‑158) has been added. It imports `vitest` helpers, `SearchEngine`, and the `GraphNode` type, then defines a `makeNode` helper (R5‑R10) that supplies default values for `type`, `summary`, `tags`, and `complexity`. A sample graph of seven nodes (`sampleNodes`, R13‑57) covers files, classes, and functions with diverse tags.

### Key changes  
- **Imports**: `vitest` (`R1`), `SearchEngine` (`R2`), `GraphNode` type (`R3`).  
- **Test data helper**: `makeNode` creates fully‑formed `GraphNode` objects (R5‑R10).  
- **Sample nodes**: seven nodes spanning `file`, `class`, and `function` types (R13‑57).  
- **Behavioral tests** (R59‑158):  
  - Empty query returns `[]` (`R60‑64`).  
  - Exact name match (`R66‑71`).  
  - Fuzzy name match (`R73‑78`).  
  - Cross‑field search on `summary` (`R80‑85`) and `tags` (`R87‑94`).  
  - Name matches rank higher than summary matches (`R96‑102`).  
  - Scores are normalized between 0 and 1 (`R104‑112`).  
  - `updateNodes` re‑indexes and includes new nodes (`R114‑137`).  
  - Type filtering (`types: ["function"]`) (`R139‑150`).  
  - Limit option (`limit: 1`) (`R153‑157`).

### Impact  
- **Coverage**: Provides comprehensive checks of `SearchEngine`’s public API, guarding against regressions in scoring, filtering, and re‑indexing.  
- **Maintainability**: Centralized `makeNode` reduces duplication for future node additions.  
- **No API change**: Only test code; production exports remain unchanged.

### Risks & follow‑ups  
- **Regression risk**: If the scoring algorithm or field indexing changes, several tests may fail. Run the full suite after core refactors.  
- **Test fragility**: Defaults in `makeNode` (e.g., `type: "file"`) could mask missing fields in real data; verify that production nodes supply required properties.  
- **Coverage gaps**: The suite does not exercise very large node sets or special characters; consider adding stress tests if performance tuning is planned.
