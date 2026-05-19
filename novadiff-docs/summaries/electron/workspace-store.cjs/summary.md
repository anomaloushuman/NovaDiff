### Overview  
A new helper `updateWorkspaceUiState` was added to `electron/workspace-store.cjs`. It updates a workspace’s UI state, persists the change to the workspace’s `meta.json`, and returns the updated session.

### Key changes  
- **New function** `updateWorkspaceUiState(userData, workspaceId, uiState)` (lines 108‑126).  
  - Loads the session (`await loadSession(userData)` – R109).  
  - Finds the workspace by ID (`findIndex` – R110).  
  - Throws `new Error("Workspace not found")` if missing (R111‑112).  
  - Merges existing `uiState` with the supplied payload (R114‑116).  
  - Updates `updatedAt` and writes the workspace back to `meta.json` (`writeJson(path.join(session.workspaces[idx].dataDir, "meta.json"), session.workspaces[idx])` – R120‑123).  
  - Returns the session (R124‑125).  
- **Export update**: `updateWorkspaceUiState` is now part of `module.exports` (line 191).  
- No other logic changes; functions such as `createWorkspace` and `updateWorkspaceLiveRepo` remain unchanged.

### Impact  
- **Correctness**: Guarantees UI state persistence and timestamping; throws a clear error when the workspace ID is invalid.  
- **Maintainability**: Centralizes UI state handling, reducing duplication.  
- **Performance**: Adds one `writeJson` call per UI update; overhead is negligible for typical usage.  
- **Compatibility**: No breaking changes; the new export is additive.

### Risks & follow‑ups  
- **Regression**: Verify that callers still work after the export change; run the full test suite.  
- **Data integrity**: Ensure `writeJson` merges `uiState` without overwriting unrelated fields in `meta.json`.  
- **Concurrency**: Multiple simultaneous UI updates will race; the last write wins. Consider locking if needed.  
- **Documentation**: Update public docs or type definitions to expose `updateWorkspaceUiState`.
