### Overview  
A new `CodeViewer` component is added at `packages/graph-view/src/components/CodeViewer.tsx` (lines 1‑415). It renders a syntax‑highlighted source file, allows line‑range selection, and can open an “Explain code” modal via the NovaDiff embed context.

### Key changes  
- **Imports** (R1‑6): React hooks, `createPortal`, Prism‑renderer (`Highlight`, `themes`), and local contexts (`useDashboardStore`, `useI18n`, `useNovaDiffEmbed`).  
- **Interfaces** (R9‑15, R16‑22): `CodeViewerProps` (accessToken, presentation, callbacks) and `SourceFile` (path, language, content, sizeBytes, lineCount).  
- **Utility functions** (R29‑33, R34‑55, R56‑60): `fileContentUrl`, `fallbackLanguage`, and `formatBytes`.  
- **Component export** (R62): `export default function CodeViewer(...)`.  
- **Logic**:  
  - Retrieves graph data via `useDashboardStore`.  
  - Loads file content with `fetch` or `embed.readFile`; demo mode (`__demo__`) blocks loading.  
  - Manages selection state (`selectAnchor`, `selectEnd`) and runs `runExplainCode` to stream explanation text to a portal modal.  
  - Renders a Prism `Highlight` block with line numbers, node‑highlighting, and user selection highlighting.

### Impact  
- **Correctness**: Asynchronous loading and error handling are present; errors are displayed in a styled card.  
- **Maintainability**: All logic resides in a single file; helper functions and interfaces keep the component readable.  
- **Performance**: Rendering large files may be heavy due to Prism tokenization; selection updates are memoized.  
- **Compatibility**: The component is isolated but requires the `useNovaDiffEmbed` and `useDashboardStore` contexts to be provided.

### Risks & follow‑ups  
- **No tests**: The diff shows no new tests; coverage for loading, error states, and explain flow is unknown.  
- **Large file rendering**: Potential performance impact from Prism tokenization is unknown from the diff.  
- **Context availability**: The component assumes `useNovaDiffEmbed` and `useDashboardStore` are present; verify that these contexts are provided in all relevant routes.  
- **Demo mode guard**: The `__demo__` token check may block legitimate use cases; confirm demo environment configuration.
