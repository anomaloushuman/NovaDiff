### Overview  
A new `PathFinderModal` component is added at `packages/graph-view/src/components/PathFinderModal.tsx`. It renders a modal that lets users select two nodes and find the shortest dependency path between them.

### Key changes  
- **Imports** (lines 1‑2): `useEffect`, `useRef`, `useState` from React and `useDashboardStore` from the local store.  
- **Props interface** (lines 4‑7): `PathFinderModalProps` with `isOpen: boolean` and `onClose: () => void`.  
- **Export** (line 9): `export default function PathFinderModal({ isOpen, onClose }: PathFinderModalProps)`.  
- **State & refs** (lines 12‑16): `fromNodeId`, `toNodeId`, `path`, `searching`, and `modalRef`.  
- **Event handling** (lines 18‑30 & 32‑44): `useEffect` hooks close the modal on outside clicks or Escape key presses.  
- **Path finding** (lines 51‑101): BFS that builds a bidirectional adjacency list from `graph.edges` (lines 60‑72) and returns the shortest path or an empty array.  
- **UI** (lines 110‑309): node selectors, “Find Path” button, and a result section that shows either “No path found” or the found path with clickable node buttons.  
- **Store usage** (lines 10‑11): accesses `graph` and `selectNode` via `useDashboardStore`.

### Impact  
- Adds a dependency‑path finder UI; no existing components are altered, so no breaking changes.  
- All logic resides in a single file and relies on the existing `useDashboardStore` hook, keeping the codebase consistent.  
- The modal’s open/close state is controlled via props, facilitating integration and testing.

### Risks & follow‑ups  
- **Performance**: unknown from the available diff/scan evidence whether BFS on large graphs may block the UI.  
- **Accessibility**: unknown from the available diff/scan evidence whether focus trapping or Escape handling conflicts with other shortcuts.  
- **Store integration**: ensure `useDashboardStore` provides `graph` and `selectNode`; run unit tests for the hook.  
- **UI correctness**: verify that the “No path found” message appears only when appropriate and that node buttons correctly trigger `selectNode` and close the modal.
