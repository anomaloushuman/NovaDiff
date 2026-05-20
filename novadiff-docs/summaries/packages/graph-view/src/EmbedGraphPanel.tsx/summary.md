### Overview
A new file `packages/graph-view/src/EmbedGraphPanel.tsx` adds a fully‑interactive graph embed for NovaDiff documentation. It renders a responsive React Flow graph inside a themed host and provides Escape‑key navigation to the overview layer.

### Key changes
- **Imports (R6‑R11)**: `useEffect`, `useRef`, `useState` from React; `ReactFlowProvider` from `@xyflow/react`; CSS import; `GraphViewInner`; `useDashboardStore`; `ThemeProvider`.  
- **Type definition (R13)**: `FlowDimensions` tracks host width/height.  
- **`EmbedEscapeToOverview` (R15‑R30)**: Listens for `Escape` key and triggers `navigateToOverview` when `navigationLevel` is `"layer-detail"`.  
- **`EmbedSizedInteractiveGraph` (R32‑R79)**: Uses a `ResizeObserver` to keep `dimensions` in sync with the host element, wrapping `GraphViewInner` in a `ReactFlowProvider`.  
- **`EmbedGraphPanel` export (R81‑R97)**: Pulls the current graph from the dashboard store, conditionally renders the sized graph or a loading overlay, and scopes them with `ThemeProvider`.

### Impact
- Adds dependency `@xyflow/react` and its CSS; must be available in the environment.  
- Introduces a global key listener and a `ResizeObserver`; both are cleaned up on unmount.  
- Requires CSS classes `embed-graph-flow-host`, `embed-graph-flow-pane`, `embed-graph-layout-overlay`, etc.; missing styles will break layout.  
- Relies on `useDashboardStore` for graph data and navigation state.

### Risks & follow‑ups
- Verify that `@xyflow/react` and its CSS are installed.  
- Ensure the global Escape listener does not interfere with other components or tests.  
- Confirm that the referenced CSS classes are defined in the shared stylesheet.  
- The component is exported but not referenced in this diff; add a usage test or integration point to validate end‑to‑end functionality.
