### Overview  
A new `DomainClusterNode` component is added to `packages/graph-view/src/components/DomainClusterNode.tsx`.  
It introduces a typed data contract (`DomainClusterData`), a node alias (`DomainClusterFlowNode`), and memoized rendering logic.

### Key changes  
- **Imports** (lines 1‑4):  
  ```ts
  import { memo } from "react";
  import { Handle, Position } from "@xyflow/react";
  import type { Node, NodeProps } from "@xyflow/react";
  import { useDashboardStore } from "../store";
  ```
- **Data contract** (lines 6‑13):  
  ```ts
  export interface DomainClusterData extends Record<string, unknown> {
    label: string;
    summary: string;
    entities?: string[];
    flowCount: number;
    businessRules?: string[];
    domainId: string;
  }
  ```
- **Node type** (line 15):  
  ```ts
  export type DomainClusterFlowNode = Node<DomainClusterData, "domain-cluster">;
  ```
- **Component** (lines 17‑64): uses `useDashboardStore` hooks for navigation, selection, and state; renders handles, label, summary, an entity list (truncated to 5 items), and a flow‑count label with pluralization.
- **Export** (line 66): `export default memo(DomainClusterNode);`

### Impact  
- The component is now available for use in the graph view; it expects a `DomainClusterFlowNode` prop.  
- It relies on `useDashboardStore` for `navigateToDomain`, `selectNode`, and `selectedNodeId`.  
- Memoization (`React.memo`) limits re‑renders when props are unchanged.

### Risks & follow‑ups  
- **Store integration**: Verify that `navigateToDomain`, `selectNode`, and `selectedNodeId` exist in the store; missing keys will cause runtime errors.  
- **Data validation**: `data.entities` is optional; the component guards against `undefined` before slicing.  
- **Pluralization logic**: Test `flowCount` values 0, 1, >1 to ensure correct label rendering.  
- **Styling**: Confirm that CSS classes (`border-accent`, `bg-accent/10`, etc.) render correctly across themes.
