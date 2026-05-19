### Overview  
Adds a `DomainGraphView.tsx` component that renders domain graphs with ReactFlow and an ELK layout. The component replaces a previous placeholder and introduces node types for domains, flows, and steps.

### Key changes  
- **Imports** (lines 1‑24): React hooks, ReactFlow components, `Edge`/`Node` types, styles, node components (`DomainClusterNode`, `FlowNode`, `StepNode`), store hooks (`useDashboardStore`), i18n (`useI18n`), layout utilities (`mergeElkPositions`, `nodesToElkInput`, `applyElkLayout`), and graph types.  
- **`BuiltGraph` interface** (lines 36‑40) and helper `getDomainMeta` (lines 32‑34).  
- **`buildDomainOverview`** (lines 42‑89): creates domain‑cluster nodes and cross‑domain edges.  
- **`buildDomainDetail`** (lines 91‑166): builds flow and step nodes, calculates ordering and counts, and produces edges between flows and steps.  
- **`DomainGraphViewInner`** (lines 168‑272):  
  - Memoizes the structural graph (`built`) based on `domainGraph` and `activeDomainId`.  
  - Runs an async ELK layout in a `useEffect`; cancellation logic prevents stale updates.  
  - Stores layout issues via `useDashboardStore.getState().appendLayoutIssues`.  
  - Renders `ReactFlow` with `nodeTypes`, controls, minimap, and background.  
- **Export** (lines 275‑281): `DomainGraphView` wraps the inner component in `ReactFlowProvider`.

### Impact  
- Introduces a fully functional graph view; no API changes.  
- Requires `useDashboardStore` and `useI18n` to be initialized.  
- New node types (`domain-cluster`, `flow-node`, `step-node`) must have corresponding component implementations.  
- Layout computation is async; layout issues are surfaced through the store.

### Risks & follow‑ups  
- **Cleanup**: The effect’s cancellation logic is present, but its effectiveness on unmount is unknown from the diff.  
- **Performance**: Impact of large graphs on render time is unknown from the available evidence.  
- **Position mapping**: Correctness of `mergeElkPositions` mapping node IDs is unknown.  
- **Issue reporting**: Whether `appendLayoutIssues` is wired to the UI is unknown from the diff.
