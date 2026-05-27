### Overview  
A new module `packages/graph-view/src/utils/performance.ts` adds shared performance thresholds and helper functions for graph rendering and ELK layout handling.

### Key changes  
- **Constants**  
  - `GRAPH_VISIBLE_ONLY_MIN_NODES` (R4) = 100.  
  - `GRAPH_ELK_WORKER_MIN_NODES` (R10) = `Number.POSITIVE_INFINITY`.  
- **Functions**  
  - `shouldOnlyRenderVisibleGraphElements` (R12‑R20) returns `false` until `layoutReady`, then checks `nodeCount >= GRAPH_VISIBLE_ONLY_MIN_NODES`.  
  - `shouldRunElkInWorker` (R22‑R24) always returns `false`, disabling worker mode.  
  - `countElkLayoutNodes` (R26‑R39) recursively counts nodes in a nested `children` array.

### Impact  
- Off‑screen node pruning is now enabled for graphs with ≥ 100 nodes, potentially reducing DOM size.  
- ELK worker mode is disabled (R10) to avoid hangs in Electron embeds, as noted in comment lines 7‑8.  
- The new exports are available for import across the repository.

### Risks & follow‑ups  
- The 100‑node threshold may need tuning; verify against typical graph sizes.  
- Monitor layout performance for graphs larger than `GRAPH_ELK_WORKER_MIN_NODES` (currently infinite).  
- Validate `countElkLayoutNodes` with deeply nested structures to ensure correct node counts.  
- Ensure no modules import the old `performance.ts` path; update imports if necessary.
