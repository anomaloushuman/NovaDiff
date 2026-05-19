### Overview  
A new component `LayerClusterNode` is added at `packages/graph-view/src/components/LayerClusterNode.tsx` (lines 1‑104). It defines a typed XYFlow node, maps complexity levels to Tailwind classes, and renders a card with source/target handles.

### Key changes  
- **Imports** (R1‑R4): `memo` from *react*; `Handle`, `Position` from *@xyflow/react*; type imports `NodeProps`, `Node`; and `getLayerColor` from `./LayerLegend`.  
- **Color mapping** (R6‑R10): `complexityColors` records `"simple"`, `"moderate"`, `"complex"` → Tailwind classes.  
- **Data contract** (R12‑R21): `export interface LayerClusterData` lists `layerId`, `layerName`, `layerDescription`, `fileCount`, `aggregateComplexity`, `layerColorIndex`, optional `searchMatchCount`, and `onDrillIn`.  
- **Node type** (R23): `export type LayerClusterFlowNode = Node<LayerClusterData, "layer-cluster">;`.  
- **Component** (R25‑R103): `function LayerClusterNode({ data }: NodeProps<LayerClusterFlowNode>)` renders a styled card with a left color bar, handles, header, name, description, file count, and optional match badge.  
- **Export** (R104): `export default memo(LayerClusterNode);` memoizes the component.

### Impact  
- **Type safety**: The interface enforces the payload shape for `"layer-cluster"` nodes.  
- **Visual consistency**: `getLayerColor` and `complexityColors` centralize styling.  
- **Performance**: Memoization limits re‑renders in large graphs.  
- **Integration**: The new node type must be registered in the XYFlow instance; otherwise it will not appear.

### Risks & follow‑ups  
- `getLayerColor` is assumed to return an object with a `label` property; if not, the left bar will break.  
- `data.aggregateComplexity` should match a key in `complexityColors`; otherwise the fallback to `"simple"` may hide mismatches.  
- Verify that `"layer-cluster"` is registered in the graph configuration.  
- Run graph‑view tests to ensure layout and interaction remain correct after adding handles and memoization.
