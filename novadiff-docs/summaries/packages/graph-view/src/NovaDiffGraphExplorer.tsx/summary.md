### Overview  
A new component `NovaDiffGraphExplorer.tsx` is added under `packages/graph-view/src`. It exposes the public API `NovaDiffGraphExplorerProps` and `NovaDiffGraphDiffOverlay`, and implements an embed‑mode wrapper and a full explorer that validates a knowledge graph, updates the dashboard store, and renders a skeleton while layout is prepared.

### Key changes  
- **File**: `packages/graph-view/src/NovaDiffGraphExplorer.tsx` (lines 1‑146).  
- **Imports**: React hooks, `validateGraph` from `@novadiff/graph-core/schema`, types `GraphIssue`, `KnowledgeGraph`, and `useDashboardStore`.  
- **Interfaces**:  
  - `NovaDiffGraphDiffOverlay` (lines 16‑20).  
  - `NovaDiffGraphExplorerProps` (lines 21‑33).  
- **Component**: `NovaDiffGraphExplorer` (lines 34‑42) delegates to `NovaDiffGraphExplorerEmbed` when `embedMode` is true, otherwise to `NovaDiffGraphExplorerFull`.  
- **Utility**: `graphFingerprint` (lines 44‑55).  
- **Full explorer** `NovaDiffGraphExplorerFull` (lines 56‑146): validates the graph via `validateGraph`, updates the store (`setGraph`, `setDiffOverlay`, view mode), handles load errors and hydration, memoizes embed context, renders a skeleton UI, and wraps `DashboardContent` with `NovaDiffEmbedContext`, `I18nProvider`, and `ThemeProvider`.

### Impact  
- Graph validation occurs client‑side; errors appear as `<p className="novadiff-graph-load-error">`.  
- Centralizes explorer logic; new interfaces provide clear contracts.  
- Fingerprint caching prevents redundant validation; `useMemo` avoids recreating context values.  
- Relies on existing store actions (`setGraph`, `setDiffOverlay`, `setViewMode`, `setIsKnowledgeGraph`, `navigateToOverview`).

### Risks & follow‑ups  
- Store API drift: verify `useDashboardStore` still exposes the required actions.  
- Dependency updates: ensure `@novadiff/graph-core/schema` still exports `validateGraph` and `GraphIssue`.  
- Effect dependencies: `useEffect` lists `[graph, setGraph]`; confirm `setGraph` is stable.  
- Embed mode handling: confirm `NovaDiffGraphExplorerEmbed` consumes `embedMode` correctly and no duplicate context providers are introduced.
