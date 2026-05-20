### Overview
A new `KnowledgeGraphPanel` component (src/components/KnowledgeGraphPanel.tsx, lines 117‑692) adds a UI for building, viewing, and interacting with a code knowledge graph. It introduces LLM‑powered code explanations and a fullscreen explorer.

### Key changes
- **Imports** – React hooks, `createPortal` (R13), type imports (`FileChange`, `LlmSettings`, `DocWorkspaceMetrics` – R14‑16), and `isNovadiffDocsReservedPath` (R17).  
- **Props interface** (`KnowledgeGraphPanelProps`, R26) defines comparison flags, titles, metrics, and loading states.  
- **Helper functions** – `parseProgressMessage` (R62‑68) extracts progress numbers; `buildAutoKey` (R70‑76) creates a cache key.  
- **Error boundary** (`GraphExplorerErrorBoundary`, R79‑115) catches explorer render errors and offers a retry button.  
- **Component logic** – state for build side, progress, stats, graph payload, viewer visibility, fullscreen, and error.  
  - `useEffect` hooks listen to `window.electronAPI.knowledgeGraphProgress`, load/build graphs, defer work with `requestIdleCallback` (fallback `setTimeout`), handle fullscreen key events, and mount the explorer.  
  - `runBuild` triggers a graph build, uses caching via `loadGraphFromDisk`, and updates UI state.  
  - `explainCode` streams LLM explanations, saves artifacts, and integrates with the explorer.  
- **UI rendering** – conditional explorer, progress card, stats grid, toolbar actions, and fullscreen portal via `createPortal`.

### Impact
- Adds a fully‑featured knowledge‑graph panel, expanding documentation capabilities.  
- Uses `requestIdleCallback` (or `setTimeout`) to defer heavy graph scans, reducing initial UI lag.  
- Progress and activity are reported through `useBackgroundActivityActionsOptional`, improving user feedback.  
- New types and helper functions centralize logic; the error boundary isolates explorer failures.

### Risks & follow‑ups
- **Electron API** – the component relies on `window.electronAPI` (e.g., `buildKnowledgeGraph`, `readKnowledgeGraph`, `llmSummarizeStream`). Verify these APIs are exposed in all builds.  
- **Idle callback support** – fallback timing should be tested on environments lacking `requestIdleCallback`.  
- **Portal usage** – `document.body` must exist when rendering (e.g., during SSR or tests).  
- **Error boundary** – errors are logged to console; ensure the retry path resets state correctly.  
- **Type safety** – run TypeScript linting to confirm imported types match actual shapes.
