### Overview  
A new file `electron/preload.cjs` (lines 1‑183) is added. It imports `contextBridge` and `ipcRenderer` from Electron and exposes a global `electronAPI` object to the renderer via `contextBridge.exposeInMainWorld`.

### Key changes  
- **API surface** – `electronAPI` now contains many `ipcRenderer.invoke` wrappers (e.g., `compareFolders`, `getFileDiff`, `pickDirectory`, `gitRepoStatus`, `workspaceCreate`, `llmSummarize`, etc.) as shown in the added lines 9‑52, 58‑71, 73‑80, 82‑84, 88‑116, 117‑120, 122‑128, 130‑140, 142‑149, 151‑158, 160‑172, 174‑181.  
- **Event listeners** – Added helpers such as `onWindowStateChanged`, `onKnowledgeGraphProgress`, `onEngineProgress`, `onSummaryPrefetchProgress`, `onGithubGhInstallProgress`, `onGithubAuthProgress`, `onWorkspaceHistoryProgress` (lines 19‑27, 55‑62, 64‑71, 73‑80, 151‑158, 165‑172, 174‑181) that register IPC listeners and return cleanup callbacks.  
- **Constants** – Introduced `LLM_STREAM` and `WINDOW_STATE` tokens (lines 5‑6).  
- **LLM streaming** – Implemented `llmSummarizeStream` (lines 88‑116) that aborts any previous stream, listens on `LLM_STREAM`, and streams accumulated text via a callback.  
- **Context isolation** – Uses `require("electron")` and `contextBridge` to safely expose APIs.

### Impact  
- **Renderer access** – Front‑end code can call backend features directly; corresponding main‑process handlers must exist.  
- **Preload linkage** – The script must be referenced in `webPreferences.preload` for all renderer windows; tests should verify this configuration.  
- **Security** – Exposing many APIs requires strict context isolation and input validation to prevent misuse.  

### Risks & follow‑ups  
- **Missing handlers** – If any invoked channel lacks a main‑process handler, renderer calls will fail; run integration tests to confirm all handlers exist.  
- **Listener leaks** – Ensure cleanup callbacks returned by the `on…` helpers are invoked; otherwise listeners may accumulate.  
- **Performance** – Unknown from the available diff/scan evidence; monitor IPC traffic for large file diffs or LLM streams.  
- **Compatibility** – Existing renderer code that does not expect `electronAPI` should handle its absence gracefully; add defensive checks if needed.
