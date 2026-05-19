### Overview  
`src/vite-env.d.ts` now declares two additional Electron API methods:  
- **`workspaceRefreshHistory`** (added lines 321‑324)  
- **`workspaceUpdateUiState`** (added lines 329‑332)  

These augment the existing `ElectronAPI` interface without removing any prior members.

### Key changes  
- `workspaceRefreshHistory(payload: {workspaceId: string; fetchRemote?: boolean}) → Promise<NovaWorkspace>`  
- `workspaceUpdateUiState(payload: {workspaceId: string; uiState: WorkspaceUiState}) → Promise<WorkspaceSessionState>`  

Both signatures are new; the rest of the interface remains unchanged (see diff lines R321‑324 and R329‑332).

### Impact  
- **Renderer side**: components can now invoke `window.electronAPI.workspaceRefreshHistory` or `workspaceUpdateUiState` to trigger a history refresh or update UI state.  
- **Type safety**: TypeScript consumers receive compile‑time checks for the new payload shapes.  
- **No breaking changes**: existing API contracts are preserved; the additions are purely additive.

### Risks & follow‑ups  
- **Main‑process implementation**: the main process must expose matching handlers; otherwise calls will fail at runtime (unknown from the available diff/scan evidence).  
- **Testing**: add unit/integration tests covering the new API paths.  
- **Documentation**: update API docs to list the new methods and their payloads.
