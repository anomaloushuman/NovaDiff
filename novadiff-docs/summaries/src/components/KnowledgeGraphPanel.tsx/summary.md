### Overview  
A new `KnowledgeGraphPanel` component is added at `src/components/KnowledgeGraphPanel.tsx` (lines 1‑692). It provides a UI for building, viewing, and interacting with a knowledge graph.

### Key changes  
- **Imports & lazy loading** – Lines 1‑17 add `createPortal`, `FileChange`, `LlmSettings`, `DocWorkspaceMetrics`, `isNovadiffDocsReservedPath`, and lazily import `NovaDiffGraphExplorer` (lines 22‑24).  
- **Props interface** – Defined at lines 26‑41 (`KnowledgeGraphPanelProps`) with fields for comparison flags, root paths, titles, file changes, LLM settings, metrics, and UI flags.  
- **Utility functions** – `parseProgressMessage` (lines 62‑68) extracts `current`/`total` from a string; `buildAutoKey` (lines 70‑76) creates a memoized key for caching.  
- **Error boundary** – `GraphExplorerErrorBoundary` (lines 79‑115) catches explorer render errors and offers a retry button that resets the boundary.  
- **State & effects** – Lines 133‑147 hold state for build side, progress, stats, payload, viewer, fullscreen, and activity. `useEffect` hooks (lines 176‑206, 305‑334, 342‑358, 380‑393) manage progress listening, build lifecycle, fullscreen handling, and mounting.  
- **Build & load logic** – `runBuild` (lines 227‑303) triggers graph construction, uses `loadGraphFromDisk` (lines 208‑225) for caching, and updates `buildGenerationRef` to avoid stale updates.  
- **Viewer & portal** – `viewerShell` (lines 469‑532) renders the explorer; `createPortal` is used for fullscreen mode (lines 676‑679).  
- **UI elements** – Toolbar buttons, progress card, stats grid, and status line are rendered conditionally based on state.

### Impact  
- The component introduces many hooks and state variables, increasing render complexity.  
- `buildGenerationRef` mitigates race conditions by ensuring only the latest build updates the UI.  
- Lazy loading and `requestIdleCallback` (lines 328‑332) defer heavy work until idle.  
- Background activity integration (`useBackgroundActivityOptional`, line 150) reports progress to the UI.

### Risks & follow‑ups  
- Verify that `@novadiff/graph-view` resolves in all target environments.  
- Ensure the `requestIdleCallback` fallback timer behaves correctly on browsers lacking the API.  
- Confirm that `createPortal` does not interfere with server‑side rendering or test setups.  
- Test that the error boundary’s retry button correctly resets the explorer state.  
- Validate that all `window.electronAPI` calls handle missing or malformed responses gracefully.
