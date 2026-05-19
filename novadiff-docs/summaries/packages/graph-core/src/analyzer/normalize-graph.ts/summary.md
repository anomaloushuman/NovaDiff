### Overview  
`packages/graph-core/src/analyzer/normalize-graph.ts` adds a pre‑processing step that normalizes node IDs, numeric complexities, and edge references before the existing `sanitizeGraph/autoFixGraph/normalizeGraph` pipeline. The file introduces new helper functions and interfaces that operate on the raw graph batch output.

### Key changes  
- **ID normalization** – `normalizeNodeId` (added at line 64) uses `stripToValidPrefix` (line 31) and `TYPE_TO_PREFIX` (line 8) to handle double‑prefixed IDs, project‑name prefixes, and bare paths.  
- **Complexity handling** – `normalizeComplexity` (line 134) maps string aliases and numeric scales to `"simple" | "moderate" | "complex"` using `VALID_COMPLEXITIES` (line 113) and `COMPLEXITY_STRING_MAP` (line 115).  
- **Edge rewriting & deduplication** – `normalizeBatchOutput` (line 202) rewrites source/target IDs via an `idMap`, infers missing types with `inferTypeFromId` (line 185), and removes duplicate edges (lines 314‑318).  
- **Dangling edge reporting** – New interfaces `DroppedEdge` (line 154) and `NormalizationStats` (line 161) capture dropped edges and statistics.  
- **Result structure** – `NormalizeBatchResult` (line 169) exposes normalized nodes, edges, the ID map, and stats.

### Impact  
- **Correctness** – Guarantees canonical `type:path` IDs and consistent complexity values before downstream processing.  
- **Maintainability** – Centralizes normalization logic; downstream modules no longer need ad‑hoc fixes.  
- **Observability** – `NormalizationStats` provides metrics for monitoring ID corrections and edge drops.  
- **Performance** – Adds a single pass over nodes and edges; map lookups are O(1) and should not noticeably affect throughput.

### Risks & follow‑ups  
- **Regression on existing IDs** – Verify that previously valid IDs remain unchanged; test idempotence of `normalizeNodeId`.  
- **Double‑prefixed ID handling** – Ensure IDs like `file:file:src/foo.ts` resolve correctly; test with varied malformed IDs.  
- **Compatibility** – Confirm no other module imports the old `normalize-graph` path; update imports if necessary.  
- **Stat accuracy** – Cross‑check `stats.idsFixed`, `stats.complexityFixed`, etc., against a known dataset.
