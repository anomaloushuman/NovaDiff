### Overview  
A new hook `useEmbedAutoExpand` is added under `packages/graph-view/src/hooks/`. It orchestrates automatic expansion of folder containers and viewport fitting when the NovaDiff embed is active and the graph layout is ready.

### Key changes  
- **Imports**: added `useEffect`, `useRef`, `useState` from React, `useReactFlow` from `@xyflow/react`, `useDashboardStore` from the store, and `useNovaDiffEmbed` from the embed context.  
- **Constants**: `EXPAND_POLL_MS` (100 ms) and `EXPAND_TIMEOUT_MS` (120 000 ms) control the polling loop for layout readiness.  
- **Interface**: `EmbedAutoExpandInput` defines the hook’s contract (`navigationLevel`, `activeLayerId`, `layoutReady`, `containerIds`, `graphFingerprint`).  
- **Helper functions**: `containersFullyLaidOut` checks if all target containers are expanded and cached; `waitForContainerLayouts` polls until layouts are ready or timeout.  
- **Hook logic**:  
  - Triggers only in embed mode and when `navigationLevel` is `"overview"` or `"layer-detail"`.  
  - Expands missing containers via `expandManyContainers`.  
  - After expansion, waits for layouts, then calls `fitView` with a smooth animation.  
  - Manages an `isExpanding` state and a cancellation flag to avoid state updates after unmount.  

### Impact  
- **Correctness**: Guarantees that the viewport is only fitted after all containers are fully laid out, preventing premature zooming.  
- **Performance**: Introduces a polling loop (`EXPAND_POLL_MS`) that may add minor overhead; the timeout (`EXPAND_TIMEOUT_MS`) protects against infinite waits.  
- **Maintainability**: Centralizes embed‑specific expansion logic; future changes to container expansion or viewport fitting can be made in one place.  
- **Observability**: Exposes `isExpanding` for UI feedback (e.g., loading spinners) and logs can be added around the polling for debugging.  

### Risks & follow‑ups  
- **Race conditions**: Verify that `expandManyContainers` completes before `waitForContainerLayouts` starts; the current implementation assumes immediate state updates.  
- **Memory leaks**: Ensure the cleanup function correctly sets `cancelledRef.current` to avoid state updates after component unmount.  
- **Compatibility**: Confirm that `useDashboardStore.getState().enterNovaDiffEmbedDepth()` and `expandedContainers` exist in all target environments.  
- **Testing**: Add unit tests for the polling logic and the `fitView` call sequence to catch regressions when layout data changes.
