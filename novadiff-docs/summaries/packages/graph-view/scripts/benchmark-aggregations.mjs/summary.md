### Overview
A new Node‑only script `packages/graph-view/scripts/benchmark-aggregations.mjs` is added to compare the performance of two graph‑aggregation strategies used in the dashboard.

### Key changes
- **Import** `performance` from `node:perf_hooks` (line 16) to time operations.  
- **`makeGraph(layerCount, nodesPerLayer)`** (lines 18‑32) builds a synthetic graph with layers and nodes of three complexity levels.  
- **`aggregateBefore(graph)`** (lines 35‑49) implements the legacy O(N × K × L) algorithm that filters nodes per layer with `Array.filter` and `Array.includes`.  
- **`aggregateAfter(graph, nodesById)`** (lines 53‑73) implements the optimized O(N + ΣKᵢ) algorithm that looks up nodes via a `Map`.  
- **`bench(label, layerCount, nodesPerLayer)`** (lines 75‑94) runs both algorithms, logs elapsed time, computes speed‑up, and checks that the outputs are identical.  
- Four benchmark runs are executed at the bottom of the file (lines 96‑99): *small*, *medium*, *large*, and *issue#102 shape*.

### Impact
- The script is isolated in the `scripts` folder and does not modify any production code or public APIs.  
- It introduces a runtime dependency on `node:perf_hooks` only when the script is executed, so it does not affect the Vite bundle.  
- The parity check gives confidence that the refactor preserves functional correctness.

### Risks & follow‑ups
- **Build exclusion**: confirm that the `scripts` folder is excluded from the Vite build (e.g., via `vite.config.js` or `.gitignore`).  
- **Environment guard**: consider adding a check to skip execution in non‑development environments to avoid accidental runs in CI.  
- **Duplicate ID safety**: the synthetic data guarantees unique node IDs; if reused elsewhere, ensure uniqueness before constructing `nodesById`.  
- **Performance sanity**: run the script locally to verify realistic `speedup` values and that parity is always `true`.
