### Overview  
A new `KnowledgeGraphView` component is added at `packages/graph-view/src/components/KnowledgeGraphView.tsx`. It renders a force‑directed graph with `@xyflow/react`, using custom node rendering, edge styling, and layout logic defined in the file.

### Key changes  
- **Imports** (lines 1‑14): added React hooks (`useMemo`, `useCallback`) and all core `@xyflow/react` components (`ReactFlow`, `ReactFlowProvider`, `Background`, `BackgroundVariant`, `Controls`, `MiniMap`).  
- **Custom node support** (lines 13‑14): imports `CustomNode` and its data type `CustomNodeData`.  
- **Layout utilities** (lines 17‑18, 38‑96): brings in `applyForceLayout`, `NODE_WIDTH`, `NODE_HEIGHT` from `../utils/layout`; defines `getNodeDimensions` (lines 38‑45) and `computeLayout` (lines 52‑94).  
- **Graph filtering & memoization** (lines 97‑286): `KnowledgeGraphViewInner` uses `useDashboardStore` to access graph state, filters nodes by type, and memoizes layout and visual nodes/edges to avoid unnecessary recomputation.  
- **Edge styling** (lines 24‑35, 199‑234): `EDGE_STYLES` maps edge types to CSS properties; edge rendering logic applies dynamic styles based on selection and focus.  
- **Provider wrapper** (lines 288‑294): default export wraps the inner component in `ReactFlowProvider`.

### Impact  
- **Correctness**: node sizing (`getNodeDimensions`) and stable positions (`computeLayout`) are now defined.  
- **Performance**: layout and node/edge construction are memoized; only graph or filter changes trigger recomputation.  
- **Maintainability**: node/edge styling and layout logic are centralized; future changes can be made in one place.  
- **Compatibility**: requires `@xyflow/react` CSS import (`@xyflow/react/dist/style.css`) and the `FlowFitOnResize` helper; ensure these dependencies are present.

### Risks & follow‑ups  
- **Layout accuracy**: verify that `applyForceLayout` produces expected positions; test with graphs of varying size.  
- **Edge style fallbacks**: `EDGE_STYLES` defaults to `related` for unknown types; confirm all used edge types are covered.  
- **Store integration**: confirm that `useDashboardStore` provides `graph`, `selectedNodeId`, etc., and that updates propagate correctly.  
- **CSS conflicts**: the global `@xyflow/react` styles may clash with existing styles; run visual regression tests.
