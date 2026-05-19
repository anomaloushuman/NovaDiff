### Overview  
Added two IPC‑exposed functions to `electron/preload.cjs` at lines 136‑141: `workspaceRefreshHistory` and `workspaceUpdateUiState`. They forward a payload to the main process via `ipcRenderer.invoke` on the channels `"workspace-refresh-history"` and `"workspace-update-ui-state"`.

### Key changes  
- New API functions inserted at lines 136‑141 (diff lines R136‑R141).  
- Each function simply calls `ipcRenderer.invoke` with the corresponding channel and payload.  
- No other imports or logic were altered; the surrounding API surface remains unchanged.

### Impact  
- Adds renderer‑side hooks for refreshing workspace history and updating UI state without affecting existing behavior.  
- No breaking changes; existing code continues to work.  
- The new functions follow the same pattern as other `workspace*` helpers, keeping the preload API consistent.

### Risks & follow‑ups  
- **Missing main‑process handlers**: Verify that `"workspace-refresh-history"` and `"workspace-update-ui-state"` are implemented in the main process; otherwise calls will fail.  
- **Documentation**: Update API docs and README to expose the new functions.  
- **Testing**: Add unit/integration tests to confirm the new IPC calls reach the main process and return expected results.
