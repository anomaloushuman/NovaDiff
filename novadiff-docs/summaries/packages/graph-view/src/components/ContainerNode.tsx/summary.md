### Overview  
A new `ContainerNode` component is added at `packages/graph-view/src/components/ContainerNode.tsx`. It defines a typed node for XYFlow and renders a button‑styled div.

### Key changes  
- **Imports** (lines 1‑3): `memo` from `react`, `NodeProps`/`Node` from `@xyflow/react`, and `getLayerColor` from `./LayerLegend`.  
- **Data contract** (lines 5‑17): `export interface ContainerNodeData` declares `containerId`, `name`, `childCount`, `strategy`, `colorIndex`, `isExpanded`, `hasSearchHits`, optional `searchHitCount`, `isDiffAffected`, `isFocusedViaChild`, and `onToggle`.  
- **Node type alias** (line 19): `export type ContainerFlowNode = Node<ContainerNodeData, "container">`.  
- **Component** (lines 21‑96): `ContainerNodeComponent` receives `NodeProps<ContainerFlowNode>`, renders a div with `role="button"`, `aria-expanded`, and `aria-label`, uses `getLayerColor` for label styling, and calls `data.onToggle` on click or key‑down.  
- **Memoization** (lines 98‑99): `const ContainerNode = memo(ContainerNodeComponent)` and `ContainerNode.displayName = "ContainerNode"`.  
- **Export** (line 101): `export default ContainerNode`.

### Impact  
- Provides a typed contract for container nodes, improving type safety.  
- Centralizes rendering logic and styling in a single component.  
- Adds accessibility attributes to aid screen‑reader interaction.

### Risks & follow‑ups  
- **Node registration**: The new node type `"container"` must be registered in the XYFlow node type registry; otherwise the graph will not render it. Unknown from the diff whether this registration exists.  
- **Styling**: Hard‑coded color values (e.g., `rgba(212,165,116,0.6)`) may conflict with theme changes; visual regression tests are recommended.  
- **Toggle handling**: `data.onToggle` is invoked on user interaction; ensure it updates the container’s expanded state in the global store to keep the UI in sync.  
- **Testing**: No unit or snapshot tests were added for this component; consider adding tests to guard against regressions.
