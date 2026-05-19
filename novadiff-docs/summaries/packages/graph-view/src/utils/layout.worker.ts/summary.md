### Overview  
A new worker script `packages/graph-view/src/utils/layout.worker.ts` is added to compute graph layouts on a background thread using the `@dagrejs/dagre` library.

### Key changes  
- Import `dagre` (line 1).  
- Export interfaces `LayoutMessage` (lines 3‑7) and `LayoutResult` (lines 10‑12).  
- `self.onmessage` handler (line 15) parses a `LayoutMessage`, builds a `dagre.graphlib.Graph`, configures layout options (`rankdir`, `nodesep`, etc.), runs `dagre.layout(g)`, and posts back a `LayoutResult` (line 46).  
- Node positions are offset by half their width/height (lines 38‑43).

### Impact  
- Centralizes layout logic in a dedicated worker, reducing coupling in UI components.  
- Offloads layout calculations from the main thread; each message rebuilds the entire graph, which may be costly for very large graphs.  
- Adds runtime dependency on `@dagrejs/dagre`; ensure it is bundled for the target environment.

### Risks & follow‑ups  
- Verify that the build pipeline emits the worker file and that target browsers support `Worker`.  
- Callers must send `LayoutMessage` objects matching the defined shape; mismatches could produce incorrect positions.  
- Confirm that the installed `@dagrejs/dagre` version matches the API used (e.g., `graphlib.Graph` constructor).  
- Unknown from the available diff/scan evidence whether this change introduces performance regressions; benchmark if needed.
