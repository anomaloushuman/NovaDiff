### Overview
A new benchmark script `packages/graph-view/scripts/benchmark-aggregations.mjs` (diff R1‑99) has been added to measure the performance difference between the legacy and refactored graph‑aggregation logic used in `useOverviewGraph`.

### Key changes
- Import added: `import { performance } from "node:perf_hooks";` (R16).  
- Graph construction helper `makeGraph(layerCount, nodesPerLayer)` (lines 18‑31).  
- Legacy aggregation `aggregateBefore(graph)` (lines 35‑49).  
- Optimized aggregation `aggregateAfter(graph, nodesById)` (lines 53‑72).  
- Benchmark runner `bench(label, layerCount, nodesPerLayer)` (lines 75‑93) times both algorithms, logs speed‑up and parity.  
- Four benchmark runs executed at the bottom of the file (lines 96‑99).

### Impact
The script outputs console logs with timing, speed‑up factor, and parity check, providing a way to verify correctness and performance of the aggregation logic without altering production code.

### Risks & follow‑ups
- Node compatibility: relies on `node:perf_hooks`; ensure the target runtime supports it.  
- Benchmark reliability: timings can vary with CPU load and V8 optimizations; consider multiple runs for precise numbers.  
- Future refactors: if aggregation logic changes again, update the benchmark accordingly.  
- Documentation: add instructions on running the script and interpreting results for future maintainers.
