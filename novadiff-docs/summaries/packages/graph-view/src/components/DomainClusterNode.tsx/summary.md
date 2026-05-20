### Overview  
A new `DomainClusterNode` component is added to the graph view, introducing a dedicated node type for domain clusters. It renders cluster metadata, handles selection and navigation via the dashboard store, and connects to the flow graph with XYFlow handles.

### Key changes  
- **Imports**: Added `memo` from React, `Handle`/`Position` and `Node`/`NodeProps` from `@xyflow/react`, and `useDashboardStore` from the local store.  
- **Data contract**: Defined `DomainClusterData` interface (label, summary, entities, flowCount, businessRules, domainId) and exported `DomainClusterFlowNode` type.  
- **Component**: `DomainClusterNode` receives `NodeProps<DomainClusterFlowNode>`, uses store selectors (`navigateToDomain`, `selectedNodeId`, `selectNode`), and renders UI with conditional entity list and flow count.  
- **Handles**: Adds target and source handles positioned left/right with custom styling.  
- **Memoization**: Exports `memo(DomainClusterNode)` to avoid unnecessary re‑renders.

### Impact  
- **Correctness**: New node type must be registered in the graph flow configuration; otherwise it will not appear.  
- **Maintainability**: Centralizes cluster node logic; future UI tweaks can be made in one place.  
- **Performance**: `memo` reduces re‑renders when unrelated props change.  
- **Compatibility**: Requires existing store selectors; if they change, this component will break.  
- **Observability**: No new logs or metrics, but UI changes may affect user interaction flow.

### Risks & follow‑ups  
- Verify that `useDashboardStore` exposes `navigateToDomain`, `selectedNodeId`, and `selectNode`; missing selectors will cause runtime errors.  
- Ensure `DomainClusterFlowNode` is added to the graph node type registry; otherwise the component will never render.  
- Confirm CSS classes (`border-accent`, `bg-accent/10`, etc.) exist in the theme; missing classes could break styling.  
- Run unit tests for the new component and integration tests for graph rendering to catch any regressions.
