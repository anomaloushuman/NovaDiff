### Overview  
`NovaDiffGraphExplorerEmbed` now imports `EmbedDashboardPanel` instead of `EmbedGraphPanel` (line 11).  
It adds explicit view‑mode handling based on `graph.kind` (lines 61‑69) and removes navigation to the overview screen during embed mode (line 71 removed, line 79 added).

### Key changes  
- **Import swap** – `import { EmbedGraphPanel } from "./EmbedGraphPanel";` removed; `import { EmbedDashboardPanel } from "./EmbedDashboardPanel";` added (line 11).  
- **View‑mode logic** – after `store.setGraph(validation.data)` the component checks `(graph as KnowledgeGraph & { kind?: string }).kind`.  
  - If `"knowledge"` it calls `store.setViewMode("knowledge")` and `store.setIsKnowledgeGraph(true)`.  
  - Otherwise it calls `store.setViewMode("structural")`, `store.setIsKnowledgeGraph(false)`, and `store.enterNovaDiffEmbedDepth()` (lines 61‑69).  
- **Cleanup effect** – `store.navigateToOverview()` removed from the cleanup effect (line 71 removed); `store.enterNovaDiffEmbedDepth()` added (line 79).  
- **Render change** – JSX now renders `<EmbedDashboardPanel graphIssues={validation.issues} />` instead of `<EmbedGraphPanel />` (line 109).

### Impact  
- Knowledge graphs are displayed in the dedicated “knowledge” view, preventing accidental structural view rendering.  
- Removing the overview navigation simplifies the embed flow and reduces state churn during initialization.  
- The component signature remains unchanged; consumers only need to import the new dashboard panel if they rely on the panel directly.

### Risks & follow‑ups  
- If a graph lacks a `kind` field, the component defaults to structural mode; confirm this is acceptable for all downstream consumers (unknown from the available diff).  
- Verify that `EmbedDashboardPanel` is exported and accepts the `graphIssues` prop; run unit tests that render the embed component.  
- Ensure that removing `store.navigateToOverview()` does not leave the UI in an inconsistent state for users expecting the overview after embedding.
