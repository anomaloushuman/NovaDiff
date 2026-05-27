### Overview  
`packages/graph-view/src/utils/elk-layout.ts` now offloads ELK layout to a WebWorker when the node count exceeds a threshold, adds a lightweight grid fallback for worker failures, and improves error handling. The file also pulls in new performance helpers and worker‑specific types.

### Key changes  
- **Imports**: added `countElkLayoutNodes` and `shouldRunElkInWorker` from `./performance`; added `ElkWorkerRequest/ElkWorkerResponse` types from `./elk-layout.worker`.  
- **Worker plumbing**: introduced `ensureLayoutWorker`, `runElkLayoutInWorker`, and `runElkLayoutOnMainThread`. A `layoutWorkerPending` map tracks promises per request ID.  
- **Fallback logic**: new `applyElkGridFallback` lays out nodes on a simple grid when ELK fails.  
- **`applyElkLayout` refactor** (lines 303‑328):  
  - Counts nodes (`countElkLayoutNodes`) and chooses worker or main‑thread execution via `shouldRunElkInWorker`.  
  - On error, if `opts.strict` is true, re‑throws; otherwise returns the grid fallback and appends a fatal issue.  
  - Removed the old “empty children” error return.  
- **Worker error handling**: `layoutWorker.onerror` now rejects all pending promises and clears the worker.

### Impact  
- **Performance**: Large graphs now run ELK in a worker, preventing UI blocking.  
- **Reliability**: Grid fallback guarantees a non‑empty layout even if ELK crashes or the worker fails.  
- **Observability**: Fatal issues are still surfaced, and the worker’s error path logs a clear message.  
- **Maintainability**: Centralized worker logic and helper imports reduce duplication.

### Risks & follow‑ups  
- **Worker creation**: Verify that the worker URL resolves correctly in all bundlers; test in both dev and production builds.  
- **Threshold tuning**: `shouldRunElkInWorker` may need adjustment for edge cases; monitor node‑count distributions.  
- **Fallback correctness**: Ensure the grid layout does not introduce visual artifacts; run visual regression tests.  
- **Error propagation**: Confirm that non‑strict mode still surfaces the fatal issue in logs and UI.
