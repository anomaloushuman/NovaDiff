### Overview  
A new utility module `packages/graph-view/src/utils/graphCityNavigation.ts` (lines R1‑R71) adds navigation helpers for the city view of the knowledge graph.

### Key changes  
- **Imports** – added at R1‑R2  
  ```ts
  import type { KnowledgeGraph } from "@novadiff/graph-core/types";
  import { resolveGraphNodeFilePath } from "./selectionCluster";
  ```
- **`containerIdForFilePath`** – exported at R5; returns `"container:~"` for paths without a slash or `"container:<top>"` for the first folder segment.  
- **`GraphCityNavStore` interface** – defined at R14‑R22; requires callbacks for depth entry, node navigation, selection, focus, container expansion, and collapsing all containers.  
- **`applyGraphCityRoot`** – exported at R23; resets the store to the city root by calling `enterNovaDiffEmbedDepth`, `collapseAllContainers`, `selectNode(null)`, and `setFocusNode(null)`.  
- **`expandFileContainer`** – internal helper at R30‑R38; expands the container derived from a file path via `containerIdForFilePath`.  
- **`applyGraphEnterFile`** – exported at R40; enters a file node, expands its container, navigates to the target node (`nodeId` or `"file:<path>"`), and sets focus if a node ID is supplied.  
- **`applyGraphFocusSelection`** – exported at R56; synchronizes a graph selection with the city view. It resolves the file path of `nodeId`, expands the relevant container(s), navigates to the node, and sets focus.

### Impact  
- Centralizes navigation side‑effects in a single module, reducing duplication.  
- No existing APIs are altered; consumers must implement `GraphCityNavStore` to use these helpers.  
- Behavior is deterministic; no new logs or metrics are introduced.

### Risks & follow‑ups  
- **Store implementation** – any missing method in `GraphCityNavStore` will cause runtime errors.  
- **`resolveGraphNodeFilePath`** – called with `graph: KnowledgeGraph | null`; ensure it handles `null` safely.  
- **Edge cases** – test `containerIdForFilePath` with paths lacking slashes or empty strings to confirm correct container IDs.  
- **Container expansion** – `expandFileContainer` only expands; verify it does not unintentionally collapse unrelated containers.
