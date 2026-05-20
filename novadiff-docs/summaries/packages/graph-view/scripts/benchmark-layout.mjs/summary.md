### Overview
A new dev script `packages/graph-view/scripts/benchmark-layout.mjs` (lines 1‑80) has been added to measure ELK layout performance for synthetic Stage 1 graphs.

### Key changes
- **Imports**: `performance` from `node:perf_hooks` (R16) and `ELK` from `elkjs/lib/elk.bundled.js` (R17).  
- **Constants**: `DEFAULT_NODE_WIDTH` 280 and `DEFAULT_NODE_HEIGHT` 120 (R19‑R21), matching production defaults in `src/utils/layout.ts`.  
- **Utility**: `fillDims` (R30‑R37) copies nodes and assigns default dimensions if missing, mirroring the production repair step.  
- **Layout wrapper**: `applyElkLayout` (R40‑R43) repairs the input with `fillDims` and calls `elk.layout`.  
- **Synthetic graph generator**: `makeGraph` (R51‑R66) builds a graph of container nodes and sparse edges, modeling Stage 1 shape.  
- **Benchmark routine**: `bench` (R68‑R75) times a single layout run and logs elapsed ms.  
- **Execution**: runs `bench` for 500, 1 000, and 3 000 nodes (R78‑R80). Comments (R9‑R12) state performance targets: <200 ms at 500 nodes, <500 ms at 3 000 nodes.

### Impact
- No production code changes; the file is a standalone dev script.  
- Requires `elkjs` and Node’s `perf_hooks`; ensure `elkjs` is in `devDependencies`.  
- Uses top‑level `await`; requires Node 14+ with ES‑module support.

### Risks & follow‑ups
- Verify `elkjs/lib/elk.bundled.js` remains a valid import path; update if the library changes.  
- Confirm CI environments support top‑level `await` and `perf_hooks`.  
- Ensure the script is not invoked in production or CI pipelines, as it can be time‑consuming.
