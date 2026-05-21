### Overview  
A new file `packages/graph-view/src/utils/selectionCluster.ts` (lines R1‑87) adds utilities for working with graph nodes and file paths. It imports `GraphEdge` and `KnowledgeGraph` from `@novadiff/graph-core/types` (R1) and defines a set of link‑relevant edge types (R3).

### Key changes  
- **`filePathFromNodeId`** (R5‑14) parses a node ID to extract a file path for `file:`, `function:`, or `class:` prefixes.  
- **`resolveGraphNodeFilePath`** (R17‑29) returns a node’s `filePath` from the graph or falls back to `filePathFromNodeId`.  
- **`graphNodeIdsInFile`** (R32‑49) collects all symbol and file node IDs belonging to a given file path, deduplicating with a `Set`.  
- **`graphSelectionCluster`** (R56‑87) builds a cluster that includes the target node, all nodes in the same file, and one‑hop neighbors over `imports`, `calls`, or `contains` edges.  
- The `LINK_EDGE_TYPES` set (R3) filters edges used in the cluster calculation.

### Impact  
- **Correctness**: deterministic file‑path resolution and cluster calculation.  
- **Maintainability**: centralizes node‑path logic, reducing duplication.  
- **Performance**: linear scans over `graph.nodes` and `edges`; caching could be added if profiling shows bottlenecks.  
- **Compatibility**: no existing API changes; the new file only adds exports.

### Risks & follow‑ups  
- **Parsing assumptions**: verify that all node ID formats in the repo match the patterns handled by `filePathFromNodeId`.  
- **Edge filtering**: ensure `LINK_EDGE_TYPES` includes all edge types that should contribute to a selection cluster.  
- **Duplicate handling**: `graphNodeIdsInFile` uses a `Set`; confirm this matches downstream expectations.  
- **Test coverage**: add unit tests for each helper, covering edge cases such as missing `filePath` or empty graphs.
