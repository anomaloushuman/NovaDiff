### Overview
A new component `PortalNode` is added to `packages/graph-view/src/components/PortalNode.tsx` (lines 1‑64). It introduces a “portal” node type that can navigate to another layer.

### Key changes
- **Imports** (`R1‑R4`):  
  ```ts
  import { memo } from "react";
  import { Handle, Position } from "@xyflow/react";
  import type { NodeProps, Node } from "@xyflow/react";
  import { getLayerColor } from "./LayerLegend";
  ```
- **Data contract** (`R6‑R12`):  
  ```ts
  export interface PortalNodeData extends Record<string, unknown> {
    targetLayerId: string;
    targetLayerName: string;
    connectionCount: number;
    layerColorIndex: number;
    onNavigate: (layerId: string) => void;
  }
  ```
- **Node type alias** (`R14`): `export type PortalFlowNode = Node<PortalNodeData, "portal">;`
- **Component implementation** (`R16‑R60`): renders a styled div with two XYFlow handles (top target, bottom source), uses `getLayerColor` for border/label colors, and triggers `data.onNavigate(data.targetLayerId)` on click.
- **Export** (`R64`): `export default memo(PortalNode);`

### Impact
- **Graph integration**: The `"portal"` type must be registered in the node type registry; otherwise nodes will not render.  
- **Navigation**: Consumers must supply an `onNavigate` callback; missing it will cause a runtime error.  
- **Styling**: Colors are derived from `getLayerColor` to match the existing layer legend.  
- **Performance**: The component is memoized, which can reduce re‑renders in large graphs.

### Risks & follow‑ups
- **Registry omission**: Verify that `"portal"` is added to the node type map.  
- **Callback safety**: Ensure `onNavigate` is always provided; consider defensive checks.  
- **Type safety**: Run TypeScript linting and tests to confirm `PortalNodeData` usage.  
- **UI regression**: Add unit tests for rendering, handle positions, and click navigation to guard against visual regressions.
