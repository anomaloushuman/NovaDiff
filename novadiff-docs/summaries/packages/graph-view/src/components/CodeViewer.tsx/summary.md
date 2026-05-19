### Overview  
A new `CodeViewer.tsx` component is added at `packages/graph-view/src/components`.  
It renders source files from the dashboard graph, supports line selection, and can request code explanations via the NovaDiff embed API.

### Key changes  
- **Imports** – React hooks, `createPortal`, Prism‑renderer (`Highlight`, `themes.vsDark`), and context hooks (`useDashboardStore`, `useI18n`, `useNovaDiffEmbed`).  
- **Interfaces** – `SourceFile` (path, language, content, sizeBytes, lineCount) and `CodeViewerProps` (accessToken, presentation, onClose, onExpand).  
- **Utility functions** – `fileContentUrl`, `fallbackLanguage`, and `formatBytes`.  
- **State** – `SourceState` tracks loading, loaded, and error states.  
- **Data fetching** – Uses `fetch(fileContentUrl(...))` or `embed.readFile` when `accessToken === "__novadiff__"`.  
- **Selection** – `selectAnchor`, `selectEnd`, `userSelection`, and `highlightedRange` manage line‑range selection and node‑range highlighting.  
- **Explain code** – `runExplainCode` calls `embed.explainCode` and displays the result in a portal‑rendered `ExplainCodeModal`.  
- **UI** – Header shows file info, a Prism‑highlighted code block with line numbers, and buttons for explain, expand, and close.

### Impact  
- **Correctness** – Explicit async handling for fetch and embed calls; error messages surface via `t.codeViewer.*` strings.  
- **Maintainability** – Centralizes file‑view logic; reusable utilities and interfaces.  
- **Performance** – Prism rendering may be heavy for large files; selection state updates trigger re‑renders.  
- **Compatibility** – Requires `react-dom` and `prism-react-renderer`; missing dependencies will break the build.  
- **Observability** – Uses `useI18n` for all UI text; errors are shown in the UI.

### Risks & follow‑ups  
- **Dependency availability** – Verify that `react-dom` and `prism-react-renderer` are listed in the package’s `package.json`.  
- **Portal target** – `createPortal` renders into `document.body`; confirm this is acceptable for the host environment (e.g., SSR).  
- **Selection logic** – Rapid clicks could produce inconsistent ranges; test shift‑click behavior.  
- **NovaDiff embed** – The component assumes `embed.readFile` and `embed.explainCode` exist; test with demo and production tokens.
