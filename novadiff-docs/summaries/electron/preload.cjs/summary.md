### Overview  
The preload script `electron/preload.cjs` now exposes four new IPC helpers. They are added at lines 45‑46 and 152‑155 and use the same `ipcRenderer.invoke` pattern as the existing API.

### Key changes  
- `scanSecurityInsights(payload)` – lines 45‑46 – invokes `"security-insights-scan"`.  
- `gitListBranches(payload)` – lines 152‑152 – invokes `"git-list-branches"`.  
- `gitListBranchCommits(payload)` – lines 153‑153 – invokes `"git-list-branch-commits"`.  
- `workspaceMaterializeCommit(payload)` – lines 154‑155 – invokes `"workspace-materialize-commit"`.  

All four helpers are simple wrappers that return the promise from `ipcRenderer.invoke`.

### Impact  
- **Correctness**: Calls will reject if the main process lacks a handler for the corresponding channel; this is standard IPC behavior.  
- **Maintainability**: Adding helpers in this consistent style keeps the preload API cohesive.  
- **Performance**: The wrappers add negligible overhead beyond normal IPC latency.  
- **Compatibility**: Existing renderer code is unaffected; no breaking changes.

### Risks & follow‑ups  
- **Missing main handlers** – verify that `"security-insights-scan"`, `"git-list-branches"`, `"git-list-branch-commits"`, and `"workspace-materialize-commit"` are implemented in the main process.  
- **Type definitions** – update TypeScript typings or add JSDoc comments for the new functions.  
- **Testing** – add unit/integration tests that exercise these IPC calls to guard against regressions.
