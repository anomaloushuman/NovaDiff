### Overview  
A new file `packages/graph-view/src/utils/activeLayer.ts` is added. It exports a helper that resolves an active layer ID into a detailed layer object, including a synthetic “project‑wide” layer.

### Key changes  
- **Import** (line 1, R1): `import type { KnowledgeGraph } from "@novadiff/graph-core/types";`  
- **Constant** (line 4, R4): `export const PROJECT_WIDE_LAYER_ID = "__novadiff_project__";`  
- **Function** (lines 6‑9, R6‑9):  
  ```ts
  export function resolveActiveLayer(
    graph: KnowledgeGraph,
    activeLayerId: string | null
  ): { id: string; name: string; description: string; nodeIds: string[] } | null
  ```  
- **Project‑wide logic** (lines 13‑26, R13‑26): if `activeLayerId === PROJECT_WIDE_LAYER_ID`, aggregates all node IDs from every layer; if no layers exist, falls back to nodes that have a `layerId`.  
- **Normal layer lookup** (lines 34‑43, R34‑43): finds the matching layer in `graph.layers` and returns its metadata.  
- **Null handling** (lines 10‑12, 35‑36, R10‑12, R35‑36): returns `null` when `graph` or `activeLayerId` is falsy, or when no matching layer is found.

### Impact  
- Provides a single source of truth for layer resolution; callers can import `resolveActiveLayer` from this file.  
- No API changes to existing modules; the new function is purely an internal helper. (unknown from the available diff/scan evidence)

### Risks & follow‑ups  
- Verify that `PROJECT_WIDE_LAYER_ID` does not collide with real layer IDs in existing projects.  
- Ensure node aggregation correctly handles cases where `graph.layers` is empty but `graph.nodes` contains nodes without `layerId`.  
- Add unit tests for both the synthetic layer path and normal layer resolution.  
- Confirm callers correctly import and use `resolveActiveLayer`; update documentation if necessary.
