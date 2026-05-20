### Overview  
A new `search.ts` module is added under `packages/graph-core/src`. It introduces a lightweight full‑text search layer powered by **Fuse.js** for `GraphNode` objects.

### Key changes  
- **Imports** (R1‑R2): `Fuse` and `IFuseOptions` from *fuse.js* and `GraphNode` from `./types.js`.  
- **Interfaces** (R4‑R7, R9‑R12):  
  - `SearchResult` exposes `nodeId` and `score` (0 = perfect match, 1 = worst).  
  - `SearchOptions` allows optional `types` filtering and a `limit`.  
- **Fuse configuration** (R14‑R25): `FUSE_OPTIONS` sets key weights, threshold, and enables extended search.  
- **`SearchEngine` class** (R27‑R65):  
  - Stores `nodes` and a `Fuse` instance.  
  - `search(query, options?)` trims the query, joins tokens with `|` for OR matching, runs Fuse, filters by `types`, limits results, and maps to `SearchResult`.  
  - `updateNodes(nodes)` rebuilds the internal index.

### Impact  
- **Functionality**: Provides a public search API for graph nodes, enabling UI search bars and tooling.  
- **Compatibility**: Requires adding *fuse.js* to dependencies; no breaking changes to existing modules.  
- **Observability**: No new logs; results are deterministic based on Fuse scoring.

### Risks & follow‑ups  
- **Dependency version**: Ensure *fuse.js* is pinned to a compatible major version.  
- **Score interpretation**: `score` is inverted (0 = perfect); confirm consumers handle this convention.  
- **Type safety**: `GraphNode["type"]` filtering assumes `type` exists; verify all node shapes meet this contract.  
- **Performance regression**: unknown from the available diff/scan evidence; benchmark search on the largest graph to confirm acceptable latency and memory usage.
