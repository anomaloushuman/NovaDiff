### Overview  
`src/app/docsExploreFilters.ts` (added R1‑158) introduces a filtering module for the documentation explorer. It defines symbol‑kind groups, change‑state filters, and utilities for toggling, matching, and mapping graph detail levels.

### Key changes  
- Import: `import type { CodeCityChangeState } from "./types";` (R1).  
- Symbol kind group type and constants:  
  - `export type SymbolKindGroup = "file" | "class" | "function";` (R4).  
  - `ALL_SYMBOL_KIND_GROUPS` array (R6‑10).  
- Change‑state filter constants: `ALL_CHANGE_STATE_FILTERS` (R12‑17).  
- Default helpers: `defaultSymbolKindGroups()` (R31‑33) and `defaultChangeStateFilters()` (R35‑37).  
- Kind resolution: `symbolKindGroupForKind()` (R39‑49).  
- Match checks: `symbolMatchesKindGroups()` (R53‑64) and `changeStateMatchesFilters()` (R68‑76).  
- Toggle utilities: `toggleSymbolKindGroup()` (R78‑92) and `toggleChangeStateFilter()` (R94‑108).  
- Active‑state predicates: `symbolKindsFilterActive()` (R110‑115) and `changeStatesFilterActive()` (R117‑124).  
- Graph detail mapping: `graphDetailFromSymbolKinds()` (R127‑151).  
- Filter key generation: `exploreFilterKey()` (R153‑158).

### Impact  
- **Correctness** – Functions provide deterministic filtering logic; no existing code paths are altered.  
- **Maintainability** – Centralized constants and helpers reduce duplication across the explorer.  
- **Performance** – Operations use small `Set`s and array filters; negligible runtime cost.  
- **Compatibility** – Only new exports; existing modules remain unchanged.

### Risks & follow‑ups  
1. **Toggle edge cases** – Verify that toggling with an empty array defaults to all groups/states and that single‑item removal preserves the array.  
2. **Graph detail logic** – Ensure `graphDetailFromSymbolKinds()` returns the expected `detailLevel` and `showFunctionsInClassView` for all combinations of enabled groups.  
3. **Filter key ordering** – Confirm that `exploreFilterKey()` consistently sorts keys to avoid cache misses.  
4. **Lint & build** – Run the repo’s lint, test, and production build to catch any type or import errors introduced by the new file.
