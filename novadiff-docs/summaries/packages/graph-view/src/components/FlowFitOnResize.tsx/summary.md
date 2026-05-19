### Overview  
A new component `FlowFitOnResize` is added to `packages/graph-view/src/components/FlowFitOnResize.tsx`. It re‑fits the XYFlow viewport when the containing pane changes size, useful for tabs that become visible after being hidden.

### Key changes  
- **Imports** (R1‑R2): `useEffect`, `useRef` from `react`; `useReactFlow` from `@xyflow/react`.  
- **Exported API** (R5): `export function FlowFitOnResize({ padding = 0.15 }: { padding?: number })`.  
- **Fit logic** (R6‑R8): grabs `fitView` from `useReactFlow`, stores it in a ref, and updates the ref on each render.  
- **Resize handling** (R10‑R30): sets up a `ResizeObserver` on the `.react-flow` element, debounces fit calls (80 ms), and catches errors when the pane isn’t ready.  
- **Cleanup** (R31‑R36): disconnects the observer and clears any pending timer on unmount.  
- **Return value** (R39‑R40): renders `null` – purely a side‑effect component.

### Impact  
- **Correctness**: re‑fits the viewport whenever the pane size changes, preventing visual glitches when a tab is shown.  
- **Maintainability**: encapsulates resize logic in a reusable component; no changes to existing flow components.  
- **Performance**: adds a `ResizeObserver` and a debounce timer; overhead is minimal unless many instances are mounted.  
- **Compatibility**: requires a `.react-flow` element; otherwise the component silently exits.

### Risks & follow‑ups  
- **Missing pane**: if `.react-flow` is not found, the component does nothing; verify that all consumers render the element.  
- **Memory leaks**: ensure the observer disconnects correctly; run a memory‑leak test after unmounting.  
- **Race conditions**: `fitView` may change between renders; the ref update mitigates stale calls.  
- **Test coverage**: add unit tests for the debounce logic and for the component’s behavior when the pane is hidden/shown.
