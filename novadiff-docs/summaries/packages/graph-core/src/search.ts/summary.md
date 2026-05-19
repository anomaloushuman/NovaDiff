### Overview  
`packages/graph-core/src/search.ts` adds a lightweight full‑text search engine built on **Fuse.js**.  
It exports three symbols:  
- `SearchResult` (R4‑7) – `{ nodeId: string; score: number; /* 0 = perfect, 1 = worst */ }`  
- `SearchOptions` (R9‑12) – `{ types?: GraphNode["type"][]; limit?: number; }`  
- `SearchEngine` (R27‑65) – a class that indexes an array of `GraphNode` objects.

### Key changes  
- **Imports**: `Fuse` and `IFuseOptions` from *fuse.js* (R1) and `GraphNode` from `./types.js` (R2).  
- **Fuse configuration** (R14‑25): keys with weights, `threshold: 0.4`, `includeScore: true`, `ignoreLocation: true`, `useExtendedSearch: true`.  
- **SearchEngine**:  
  - `constructor(nodes)` stores the nodes and builds a Fuse index.  
  - `search(query, options?)` trims the query, turns space‑separated tokens into an OR‑style extended query (`"a b" → "a | b"`), runs Fuse, filters by `options.types` if supplied, limits to `options.limit` (default 50), and maps results to `SearchResult`.  
  - `updateNodes(nodes)` rebuilds the internal index.

### Impact  
- **Correctness**: deterministic scoring (0–1) and filtering by type.  
- **Maintainability**: all search logic resides in a single module; changes to `FUSE_OPTIONS` propagate automatically.  
- **Compatibility**: introduces a runtime dependency on `fuse.js`; no existing public APIs are altered.

### Risks & follow‑ups  
- **Dependency missing**: ensure `fuse.js` is listed in `package.json` and bundled.  
- **Type mismatches**: `GraphNode` must expose `id`, `type`, `name`, `tags`, `summary`, and `languageNotes` as used in the Fuse keys.  
- **Threshold tuning**: the chosen `0.4` may affect recall; benchmark if needed.  
- **Extended search behavior**: the OR logic could match unintended tokens; validate with edge‑case queries.
