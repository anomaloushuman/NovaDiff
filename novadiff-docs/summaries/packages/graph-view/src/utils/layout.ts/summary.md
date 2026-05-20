### Overview  
`packages/graph-view/src/utils/layout.ts` (lines 1‑266) introduces a new layout utility.  
It defines default dimensions (`NODE_WIDTH`, `NODE_HEIGHT`, `LAYER_CLUSTER_WIDTH`, `LAYER_CLUSTER_HEIGHT`, `PORTAL_NODE_WIDTH`, `PORTAL_NODE_HEIGHT` – lines 15‑20) and exports three layout helpers:

* `applyDagreLayout` (lines 30‑79) – builds a Dagre graph, applies spacing heuristics, and returns positioned nodes.  
* `applyForceLayout` (lines 94‑189) – constructs a d3‑force simulation, optionally clusters by community, and ticks synchronously to convergence.  
* ELK helpers (lines 195‑266) – `ELK_DEFAULT_LAYOUT_OPTIONS` (lines 195‑204), `nodesToElkInput` (lines 206‑228), and `mergeElkPositions` (lines 231‑266).

### Key changes  
* **Imports** – added `dagre` and d3‑force functions (`forceSimulation`, `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`, `forceX`, `forceY`) plus type imports for `SimulationNodeDatum`, `SimulationLinkDatum`, `Node`, `Edge`, and `ElkInput`.  
* **Constants** – default node and cluster sizes exported.  
* **`applyDagreLayout`** – synchronous layout for small graphs, using Dagre’s `layout` method.  
* **`applyForceLayout`** – synchronous force‑directed layout for knowledge graphs, with optional community clustering via `forceX`/`forceY`.  
* **ELK helpers** – convert `xyflow` nodes/edges to `ElkInput` and merge ELK‑computed positions back onto the original nodes, preserving width/height for container nodes.

### Impact  
* Centralizes layout logic and constants, reducing duplication.  
* Provides deterministic, reproducible layouts for small and knowledge‑graph use cases.  
* Exposes a clear API for future components to import layout functions.

### Risks & follow‑ups  
* Verify that components previously using inline layout logic correctly import and use the new helpers.  
* Add unit tests for edge cases such as empty node lists or missing `id` fields.  
* Benchmark `applyForceLayout` on larger graphs to ensure the tick limit (≤ 300) is sufficient; consider exposing a configurable tick count if needed.  
* Confirm that `nodesToElkInput` and `mergeElkPositions` handle container nodes as expected in downstream rendering.
