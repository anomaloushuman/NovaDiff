### Overview  
`GraphEmbedSyncBridge` now accepts optional props `detailLevel`, `showFunctionsInClassView`, and `cityFilterNodeIds`. These props are synced to the dashboard store via new `useEffect` hooks. The import statement was updated to expose the `DetailLevel` type.

### Key changes  
- **Import** (R2): `import { useDashboardStore, type DetailLevel } from "./store";`  
- **Prop signature** (R15‑17, R23‑26): added `detailLevel?: DetailLevel`, `showFunctionsInClassView?: boolean`, `cityFilterNodeIds?: string[] | null`.  
- **Detail level sync** (R67‑74): effect updates `store.setDetailLevel` when `detailLevel` differs from the store.  
- **Function view toggle** (R75‑84): effect updates `store.setState` with `showFunctionsInClassView` and resets layout caches when the flag changes.  
- **City filter sync** (R88‑106): effect calls `store.setEmbedCityFilterNodeIds` and clears selection/focus if the active node is filtered out.  
- **Selection change** (unchanged): still emits `onSelectionChange` when `selectedNodeId` changes.

### Impact  
- The component now fully controls the dashboard’s detail level, function view, and city filter, keeping the UI in sync with embedded graph interactions.  
- Optional props preserve backward compatibility.  
- Each new effect guards against unnecessary store updates, minimizing runtime cost.

### Risks & follow‑ups  
- Verify that `useDashboardStore` exposes `setDetailLevel`, `setEmbedCityFilterNodeIds`, and the `showFunctionsInClassView` flag; otherwise TypeScript errors will surface.  
- Ensure existing tests that render `GraphEmbedSyncBridge` without the new props still pass.  
- Confirm that setting `cityFilterNodeIds` to `null` correctly resets the graph without leaving dangling selections.  
- Check that the new `useEffect` blocks do not trigger infinite loops when the store’s state changes in response to the same props.
