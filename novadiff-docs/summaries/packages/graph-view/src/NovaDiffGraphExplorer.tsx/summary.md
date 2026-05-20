### Overview  
A new `NovaDiffGraphExplorer.tsx` component is added to `packages/graph-view/src`. It exposes the public API `NovaDiffGraphExplorerProps` (lines 21‑33) and `NovaDiffGraphDiffOverlay` (lines 16‑20), and implements both an embedded and a full graph explorer mode.

### Key changes  
- **Imports** (R1‑R6): added React hooks, `validateGraph`, type imports (`GraphIssue`, `KnowledgeGraph`), and the local `useDashboardStore`.  
- **Public interfaces** (R16‑R21): declare the overlay and props shapes.  
- **Entry point** (R34‑R42): `NovaDiffGraphExplorer` dispatches to `NovaDiffGraphExplorerEmbed` or `NovaDiffGraphExplorerFull` based on `embedMode`.  
- **Fingerprinting** (R44‑R53): `graphFingerprint` builds a deterministic string to skip re‑validation when the graph hasn’t changed.  
- **Full explorer logic** (R56‑R146):  
  - Validates the graph with `validateGraph`; updates the store (`setGraph`, `setDiffOverlay`) and view mode.  
  - Handles diff overlay updates, load errors, hydration state, and skeleton UI.  
  - Provides `NovaDiffEmbedContext` and `ThemeProvider` to child components.

### Impact  
- Immediate validation of incoming graphs; clear error messages for invalid data.  
- Centralizes graph handling; separates embed logic.  
- Fingerprint caching avoids redundant validation on unchanged graphs.  
- Skeleton UI and error paragraph give users feedback during loading or failure.

### Risks & follow‑ups  
- **Validation contract**: ensure `validateGraph` returns the expected shape; otherwise store updates may fail.  
- **Store side‑effects**: `useDashboardStore` mutations (`setGraph`, `setDiffOverlay`, view mode switches) must be idempotent; test repeated renders.  
- **Embed mode toggle**: verify `embedMode` correctly routes to `NovaDiffGraphExplorerEmbed`; regression could break embedded deployments.  
- **Type safety**: `Omit<NovaDiffGraphExplorerProps, "embedMode">` assumes no other required props are omitted; future prop additions could break the signature.
