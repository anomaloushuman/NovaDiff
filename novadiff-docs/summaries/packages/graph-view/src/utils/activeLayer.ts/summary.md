### Overview  
A new utility `packages/graph-view/src/utils/activeLayer.ts` is added to resolve the active layer from a `KnowledgeGraph`. It introduces a synthetic project‑wide layer ID and handles both normal and project‑wide cases.

### Key changes  
- **Import** `KnowledgeGraph` type (`R1`).  
- **Constant** `PROJECT_WIDE_LAYER_ID = "__novadiff_project__"` (`R4`).  
- **Exported function** `resolveActiveLayer` (`R6`).  
- Handles `null` graph or activeLayerId (`R10‑12`).  
- Special case for `PROJECT_WIDE_LAYER_ID`: aggregates all node IDs across layers or falls back to all nodes (`R13‑32`).  
- Normal case: finds the layer by ID and returns its metadata (`R34‑43`).  
- Returns `null` if the layer is not found (`R35‑36`).

### Impact  
- **Correctness**: Guarantees a consistent view for the project‑wide synthetic layer, preventing missing node data when no layers exist.  
- **Maintainability**: Centralizes layer resolution logic; other modules can import `resolveActiveLayer` instead of duplicating code.  
- **Performance**: Linear scans over `graph.layers` and `graph.nodes`; acceptable for current graph sizes.  
- **Compatibility**: No API changes; purely an internal helper.  

### Risks & follow‑ups  
- Verify that `graph.layers` and `graph.nodes` are populated as expected; otherwise the fallback logic may return incomplete data.  
- Ensure `PROJECT_WIDE_LAYER_ID` does not collide with real layer IDs in future data models.  
- Add unit tests covering both the synthetic layer and normal layer resolution paths.  
- Confirm that the deduplication via `Set` correctly handles duplicate node IDs across layers.
