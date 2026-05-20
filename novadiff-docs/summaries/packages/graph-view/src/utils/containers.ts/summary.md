### Overview  
`packages/graph-view/src/utils/containers.ts` is a new module that derives logical containers from graph nodes. It groups nodes by folder structure, falls back to community detection when folder grouping is insufficient, and suppresses single‑child containers for larger graphs.

### Key changes  
- **Imports** – `GraphNode`/`GraphEdge` from `@novadiff/graph-core/types` and `detectCommunities` from `./louvain` (lines 1‑5).  
- **Interfaces** – `DerivedContainer` (id, name, nodeIds, strategy) and `DeriveResult` (containers, ungrouped) (lines 7‑17).  
- **Helper functions**  
  - `commonPrefix(paths)` (lines 30‑45) finds the longest common directory prefix.  
  - `firstSegment(path)` (lines 47‑50) extracts the first path segment.  
  - `groupByFolder(nodes)` (lines 52‑75) groups nodes by the first segment after trimming the common prefix.  
  - `shouldFallbackToCommunity(groups, rooted, totalNodes)` (lines 77‑89) decides whether to use community detection based on bucket count and concentration thresholds.  
- **Main export** – `deriveContainers(nodes, edges)` (lines 91‑156) orchestrates grouping, optional community detection, container creation, and suppression of single‑child containers when `nodes.length ≥ MIN_NODES_FOR_SUPPRESSION`.

### Impact  
- **Correctness** – deterministic container derivation; community fallback is used when bucket count < `MIN_BUCKET_COUNT` or any bucket exceeds `MAX_CONCENTRATION`.  
- **Maintainability** – all container logic resides in a single module with clear type contracts.  
- **Performance** – community detection (`detectCommunities`) is invoked only when needed; suppression is a linear pass over containers.  
- **Compatibility** – no existing API changes; new exports are additive.  
- **Observability** – exported functions can be unit‑tested; thresholds are exposed as constants.

### Risks & follow‑ups  
- **Community detection accuracy** – unknown from the available diff; verify clusters for typical graph shapes.  
- **Suppression edge cases** – ensure nodes in single‑child containers are moved to `ungrouped` when `nodes.length ≥ MIN_NODES_FOR_SUPPRESSION`.  
- **Folder grouping correctness** – test `commonPrefix` and `firstSegment` with paths lacking slashes or containing only a root.  
- **Integration** – downstream consumers must handle the new `strategy` field (`folder` vs `community`).
