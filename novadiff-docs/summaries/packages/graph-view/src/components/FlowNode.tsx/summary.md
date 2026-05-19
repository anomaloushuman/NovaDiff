### Overview  
A new `FlowNode` component is added to `packages/graph-view/src/components/FlowNode.tsx` (lines 17‑52). It renders a node with left/right handles, displays entry point, label, summary, and step count, and highlights when the node is selected.

### Key changes  
- **Imports**: added `memo` from React (R1), `Handle` & `Position` from `@xyflow/react` (R2), type imports `Node` & `NodeProps` (R3), and `useDashboardStore` from the local store (R4).  
- **Data contract**: defined `FlowNodeData` interface (lines 6‑13, R6‑R13) with `label`, `summary`, optional `entryPoint`/`entryType`, `stepCount`, and `flowId`.  
- **Node type**: introduced `FlowFlowNode` alias for `Node<FlowNodeData, "flow-node">` (R15).  
- **Component**: `FlowNode` (lines 17‑51) uses `useDashboardStore` selectors `selectNode` and `selectedNodeId`, applies conditional styling, and renders `Handle` components.  
- **Export**: default export is `memo(FlowNode)` (R52).

### Impact  
- Adds a distinct node type without modifying existing graph logic.  
- Memoization via `React.memo` should reduce unnecessary re‑renders.  
- Relies on existing `useDashboardStore` selectors, keeping consistency with the dashboard state.

### Risks & follow‑ups  
- **Data integrity**: unknown from the available diff/scan evidence whether all `FlowNodeData` fields are supplied by the graph state.  
- **Store selectors**: unknown from the available diff/scan evidence if `selectNode` and `selectedNodeId` are correctly typed and available.  
- **Handle rendering**: unknown from the available diff/scan evidence whether the `Handle` components interfere with other node types or layout.  
- **Memoization correctness**: unknown from the available diff/scan evidence whether prop changes trigger re‑renders as expected.
