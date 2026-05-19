### Overview  
A new `StepNode` component was added to `packages/graph-view/src/components/StepNode.tsx`.  
It defines a typed node for the graph flow, memoizes the component, and connects to the dashboard store for selection handling.

### Key changes  
- **Imports** (lines 1‑4): added `memo` from `react`; `Handle`, `Position` from `@xyflow/react`; type imports for `Node` and `NodeProps`; and `useDashboardStore` from the local store.  
- **Data contract** (lines 6‑12): `export interface StepNodeData extends Record<string, unknown>` with `label`, `summary`, optional `filePath`, `stepId`, and `order`.  
- **Node type** (line 14): `export type StepFlowNode = Node<StepNodeData, "step-node">`.  
- **Component** (lines 16‑51): renders a styled div with left/right handles, displays order, label, summary, optional file path, and uses store hooks to determine selection state and dispatch `selectNode`.  
- **Memoization** (line 53): exported as `export default memo(StepNode)`.

### Impact  
- **Type safety**: The `StepNodeData` interface ensures that node data conforms to the expected shape at compile time.  
- **Render efficiency**: `memo` prevents re‑renders when unrelated props change.  
- **Centralized definition**: `StepFlowNode` simplifies future extensions or refactors of node types.  
- **Store interaction**: The component reads `selectedNodeId` and calls `selectNode` from the dashboard store, enabling consistent selection state across the graph.

### Risks & follow‑ups  
- **Store integration**: Verify that `selectNode` and `selectedNodeId` exist in the store; missing keys will cause runtime errors.  
- **Styling consistency**: Ensure CSS classes (`border-accent`, `bg-elevated`, etc.) are defined; otherwise the node may appear broken.  
- **Handle positioning**: Confirm that `Position.Left` and `Position.Right` align with the graph layout; misplacement could affect drag behavior.  
- **Testing coverage**: Add unit tests for rendering, selection logic, and memoization to guard against future regressions.
