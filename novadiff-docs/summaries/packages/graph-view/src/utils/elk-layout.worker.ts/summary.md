### Overview  
A new worker script `packages/graph-view/src/utils/elk-layout.worker.ts` (lines 1‑51) adds off‑main‑thread ELK layout. The file header (R1‑3) states it keeps the UI responsive on large knowledge graphs.

### Key changes  
- **Message types**:  
  - `ElkWorkerRequest` (R6‑9)  
  - `ElkWorkerSuccess` (R11‑15)  
  - `ElkWorkerFailure` (R17‑21)  
  - `ElkWorkerResponse` union (R23)  
- **Lazy ELK loading**: `getElk()` (R27‑31) caches a `Promise<ElkLayoutInstance>` created via `loadElkConstructor()` imported from `./elk-bundled` (R4).  
- **Worker loop**: `self.onmessage` (R34‑51) receives `ElkWorkerRequest`, runs `elk.layout(input)`, and posts back either `ElkWorkerSuccess` or `ElkWorkerFailure`. Errors are stringified and returned in `ElkWorkerFailure`.

### Impact  
- **Execution context**: Layout runs inside a Web Worker, isolating heavy computation from the main thread.  
- **Type safety**: Typed interfaces reduce runtime message‑handling bugs.  
- **Build**: The worker is a separate bundle; it must be emitted by the build system and referenced by the application.

### Risks & follow‑ups  
- **Worker registration**: Ensure the worker script is correctly referenced in the application entry point and emitted to the expected location.  
- **ELK constructor loading**: `loadElkConstructor()` must resolve to a valid constructor; otherwise layout requests will fail.  
- **Concurrency**: Multiple requests share the same `elkPromise`; confirm that this does not cause race conditions or stale state.  
- **Error surface**: `err instanceof Error` is used to extract the message; unknown from the available diff/scan evidence whether all error types are handled correctly.
