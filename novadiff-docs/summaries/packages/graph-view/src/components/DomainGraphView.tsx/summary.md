### Overview  
A new `DomainGraphView` component is added at `packages/graph-view/src/components/DomainGraphView.tsx` (lines 1‑281). It renders a domain‑level graph with `@xyflow/react`, builds nodes and edges from a `KnowledgeGraph`, and applies an ELK layout.

### Key changes  
- **Imports** – added React hooks and `@xyflow/react` components (`ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `MiniMap`, `BackgroundVariant`) and type imports for `Edge`/`Node` (R1‑10).  
- **Node types** – `nodeTypes` maps `"domain-cluster"`, `"flow-node"`, and `"step-node"` to `DomainClusterNode`, `FlowNode`, and `StepNode` (lines 26‑30).  
- **Helper functions** –  
  - `getDomainMeta` (lines 32‑34) extracts domain metadata.  
  - `buildDomainOverview` (lines 42‑90) creates a cluster view of all domains with cross‑domain edges.  
  - `buildDomainDetail` (lines 91‑166) expands a selected domain into flows and steps, computing step order and counts.  
- **`DomainGraphViewInner`** (lines 168‑272) memoizes the graph structure, runs `applyElkLayout` (lines 201‑212) asynchronously, and renders `ReactFlow` with background, controls, and minimap.  
- **Export** – default `DomainGraphView` (lines 275‑281) wraps `DomainGraphViewInner` in `ReactFlowProvider`.

### Impact  
- **State integration** – uses `useDashboardStore` to read `domainGraph`, `activeDomainId`, `clearActiveDomain`, and to append layout issues via `appendLayoutIssues` (lines 169‑207).  
- **Error handling** – layout failures are logged to console (lines 213‑216).  
- **Performance** – graph construction is memoized; ELK layout runs asynchronously, reducing UI blocking.

### Risks & follow‑ups  
- **Layout failures** – ELK may reject complex graphs; verify that `applyElkLayout` resolves or logs errors.  
- **Store contract** – `useDashboardStore` must expose the required actions and state slices.  
- **Type safety** – `KnowledgeGraph` nodes/edges must match the expected shapes; mismatches could break `buildDomainDetail`.  
- **Performance regression** – large graphs may cause UI lag; benchmark ELK layout time and consider caching or throttling.
