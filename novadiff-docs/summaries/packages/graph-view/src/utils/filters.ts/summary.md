### Overview  
`packages/graph-view/src/utils/filters.ts` introduces typed filtering utilities for graph nodes and edges. The module replaces ad‑hoc logic with reusable functions that operate on pre‑computed indices.

### Key changes  
- **Imports** (lines 1‑3):  
  ```ts
  import type { GraphNode, GraphEdge } from "@novadiff/graph-core/types";
  import type { FilterState, NodeType, Complexity, EdgeCategory } from "../store";
  import { EDGE_CATEGORY_MAP } from "../store";
  ```
- **`filterNodes`** (lines 19‑52):  
  * Filters by `nodeTypes` and `complexities`.  
  * Uses `nodeIdToLayerIds: Map<string, Set<string>>` for O(1) layer membership checks, matching the “any‑layer‑wins” semantics described in the comment.  
- **`filterEdges`** (lines 57‑76):  
  * Keeps only edges whose `source` and `target` are in `visibleNodeIds`.  
  * Filters by edge category via `getEdgeCategory`.  
- **`getEdgeCategory`** (lines 81‑88):  
  * Looks up an edge’s category in `EDGE_CATEGORY_MAP`; returns `null` if the type is unknown.

### Impact  
- **Performance**: The comment in `filterNodes` notes that the new O(1) layer lookup removes the former O(N × L × K) cost that dominated export time on large graphs (#102).  
- **Correctness**: Explicit type checks prevent accidental inclusion of unsupported node types or complexities.  
- **Maintainability**: Centralized filtering logic simplifies future extensions (e.g., new node/edge attributes).  

### Risks & follow‑ups  
- **Edge category coverage**: `getEdgeCategory` returns `null` for unknown types, causing `filterEdges` to drop those edges. Verify that `EDGE_CATEGORY_MAP` contains all used edge types.  
- **Layer index consistency**: `nodeIdToLayerIds` must be correctly populated in the store; stale indices could misfilter nodes.  
- **Compatibility**: Confirm that existing consumers still receive the same node/edge sets after the refactor (unknown from the diff).  
- **Testing**: Add unit tests for `filterNodes` and `filterEdges` covering cases such as no layers selected, multi‑layer nodes, and unknown categories.
