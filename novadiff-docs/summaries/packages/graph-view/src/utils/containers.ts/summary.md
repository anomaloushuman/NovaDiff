### Overview  
A new utility module `packages/graph-view/src/utils/containers.ts` is added. It derives container metadata for graph nodes by grouping them either by folder structure or, when necessary, by community detection.

### Key changes  
- **Imports** (lines 1‑5): `GraphNode`, `GraphEdge` from `@novadiff/graph-core/types` and `detectCommunities` from `./louvain`.  
- **Interfaces** (lines 7‑12, 14‑17): `DerivedContainer` and `DeriveResult` expose container id, name, node ids, and strategy.  
- **Folder grouping** (lines 52‑75): `groupByFolder` uses `commonPrefix` (lines 30‑45) and `firstSegment` (lines 47‑51) to bucket nodes by the first path segment after trimming the longest common prefix.  
- **Fallback decision** (lines 77‑89): `shouldFallbackToCommunity` returns true when bucket count is below `MIN_BUCKET_COUNT` or any bucket exceeds `MAX_CONCENTRATION`.  
- **Derivation entry point** (lines 91‑156): `deriveContainers` orchestrates grouping, optional community fallback, suppression of single‑child containers (when `nodes.length >= MIN_NODES_FOR_SUPPRESSION`), and returns `{ containers, ungrouped }`.  
- **Constants** (lines 19‑23): `MIN_BUCKET_COUNT`, `MAX_CONCENTRATION`, `MIN_NODES_FOR_SUPPRESSION`, `ROOT_BUCKET` control the heuristics.

### Impact  
- **Deterministic grouping**: Nodes are consistently bucketed by folder or community.  
- **Optional community detection**: Invoked only when `shouldFallbackToCommunity` deems folder grouping insufficient, reducing unnecessary analysis.  
- **Single‑child suppression**: Containers with a single node are removed and the node is returned in `ungrouped`.  
- **Root bucket handling**: Nodes without a `filePath` are placed in a special `ROOT_BUCKET` container.  
- **No API changes**: Existing consumers can import the new module without altering existing code.

### Risks & follow‑ups  
- **Community detection integration**: The behavior of `detectCommunities` is not shown in the diff; verify that it returns `(nodeId, cid)` pairs as expected.  
- **Edge‑case handling**: Ensure nodes lacking `filePath` are correctly routed to `ROOT_BUCKET` and that suppression respects `MIN_NODES_FOR_SUPPRESSION`.  
- **Threshold tuning**: `MIN_BUCKET_COUNT` and `MAX_CONCENTRATION` may need adjustment for different graph sizes; monitor clustering quality.  
- **Performance regression**: Benchmark `deriveContainers` on large graphs to confirm community fallback does not introduce significant overhead.
