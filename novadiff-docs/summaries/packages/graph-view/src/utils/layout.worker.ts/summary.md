### Overview  
A new worker module `packages/graph-view/src/utils/layout.worker.ts` is added to perform graph layout calculations using the `@dagrejs/dagre` library. It defines the public contract through `LayoutMessage` (lines 3‑7) and `LayoutResult` (lines 10‑12) and exposes a message handler that receives node/edge data, runs Dagre, and posts back node positions.

### Key changes  
- **Import** `dagre` (R1).  
- **Exported interfaces** `LayoutMessage` (R3‑R7) and `LayoutResult` (R10‑R12).  
- **Message handler** (`self.onmessage`, R15‑R47) parses `LayoutMessage`, builds a Dagre graph, configures layout options (`rankdir`, `nodesep`, etc.), runs `dagre.layout`, and constructs a `positions` map.  
- **Result posting** (`self.postMessage`, R46) sends back a `LayoutResult` object, using `satisfies LayoutResult` for type safety.  
- The worker is self‑contained; no external state is referenced.

### Impact  
- **Deterministic layout**: given the same node dimensions and edge list, the worker produces the same positions.  
- **Performance**: layout is performed in a Web Worker, preventing UI thread blocking for large graphs.  
- **Explicit API**: exported interfaces make the worker’s contract clear and testable.  
- **Dependency**: requires `@dagrejs/dagre`; ensure it is listed in `package.json` and bundled correctly.

### Risks & follow‑ups  
- **Dependency version**: verify that the installed `@dagrejs/dagre` version matches the API used (`graphlib.Graph`).  
- **Worker registration**: confirm that consuming code correctly instantiates this worker and handles its `onmessage` responses.  
- **Edge cases**: test with empty node/edge arrays to ensure no runtime errors.  
- **Type safety**: ensure that the `satisfies LayoutResult` check passes in all build configurations; adjust TS settings if necessary.
