### Overview
A new utility `packages/graph-view/src/utils/louvain.ts` introduces Louvain community detection for a subset of graph nodes and edges. It exports `detectCommunities`, which builds an undirected graph, runs `graphology-communities-louvain`, and returns a `Map<string, number>` of node‑to‑community assignments.

### Key changes
- **New imports**: `Graph` from `graphology`, `louvain` from `graphology-communities-louvain`, and `GraphEdge` type from `@novadiff/graph-core/types`.  
- **`detectCommunities` implementation**:  
  - Builds a graph with `new Graph({ type: "undirected", multi: false })`.  
  - Adds only nodes in `nodeIds` and edges whose endpoints are both in that set, filtering out self‑loops and duplicates.  
  - Calls `louvain(g)` and maps the result to a `Map`.  
  - Defensive reassignment: any `-1` sentinels are replaced with unique IDs beyond the current maximum.  
- **Export**: The function is exported for external use.

### Impact
- **Correctness**: Guarantees unique community IDs even if the underlying library omits nodes or returns `-1`.  
- **Performance**: Graph construction and edge filtering add O(|E|) overhead; acceptable for moderate graph sizes but may impact large datasets.  
- **Maintainability**: Centralizes community detection logic; future updates to `graphology-communities-louvain` can be isolated here.  
- **Compatibility**: No changes to existing APIs; simply adds a new helper.  
- **Observability**: No logging; consumers should handle the returned `Map` directly.

### Risks & follow‑ups
- **Library version drift**: Verify that `graphology-communities-louvain` v2 still returns `Record<string, number>` and that the defensive logic remains necessary.  
- **Edge cases**: Test with disconnected nodes, self‑loops, and duplicate edges to ensure the filtering logic behaves as intended.  
- **Performance regression**: Benchmark on large node sets to confirm the graph construction cost is acceptable.  
- **Type safety**: Ensure `GraphEdge` type aligns with the edges passed to `detectCommunities`; mismatches could cause runtime errors.
