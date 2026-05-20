### Overview  
`packages/graph-core/src/analyzer/normalize-graph.ts` adds a set of utilities for normalizing graph data. The file introduces new functions, constants, and interfaces that operate on node IDs, complexity values, and batch‑output structures.

### Key changes  
- **`normalizeNodeId`** – lines 64‑110: normalizes IDs to `type:path`, handling double prefixes, project‑name prefixes, and bare paths.  
- **`normalizeComplexity`** – lines 134‑152: maps string aliases and numeric scales to `"simple" | "moderate" | "complex"`.  
- **`normalizeBatchOutput`** – lines 202‑329: processes raw nodes/edges, fixes IDs, normalizes complexity, rewrites edge references, deduplicates nodes/edges, drops dangling edges, and returns a `NormalizeBatchResult`.  
- **Interfaces** – `DroppedEdge` (lines 154‑158), `NormalizationStats` (lines 161‑166), `NormalizeBatchResult` (lines 169‑173) provide structured output and metrics.  
- **Helper constants** – `VALID_PREFIXES`, `TYPE_TO_PREFIX`, `VALID_COMPLEXITIES`, `COMPLEXITY_STRING_MAP`, `PREFIX_TO_TYPE` support the logic.  
- **`inferTypeFromId`** – lines 184‑192: derives a node type from an ID prefix, used during edge rewriting.

### Impact  
- **Correctness**: guarantees canonical IDs and complexity values before upstream pipelines, reducing downstream errors.  
- **Observability**: `NormalizationStats` exposes counts of fixed IDs, complexity corrections, rewritten edges, and dropped edges.  
- **Maintainability**: centralizes normalization logic; future changes to ID/complexity rules can be made in one place.  
- **Performance**: operations use `Map`/`Set` lookups, yielding linear‑time processing over nodes and edges.  
- **Compatibility**: adds new exports but does not alter existing APIs; other modules can import these utilities without breaking changes.

### Risks & follow‑ups  
- **Regression in ID handling**: verify that legacy double‑prefixed IDs are still resolved correctly.  
- **Edge deduplication**: ensure that deduplication does not drop legitimate parallel edges; run integration tests on graphs with intentional duplicates.  
- **Stats accuracy**: cross‑check `NormalizationStats` against manual counts on sample datasets.  
- **Cross‑module interactions**: confirm that downstream consumers of `normalizeBatchOutput` correctly handle the new `idMap` and `stats` fields.
