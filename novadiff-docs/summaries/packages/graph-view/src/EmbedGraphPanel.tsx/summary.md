### Overview  
A new `EmbedGraphPanel` component is added in **packages/graph-view/src/EmbedGraphPanel.tsx** (lines 263‑279). It renders a lightweight overview graph with `@xyflow/react` and does not depend on the global Zustand store.

### Key changes  
- **Imports** – React hooks (`useEffect`, `useMemo`, `useRef`, `useState`) and XYFlow utilities (`Background`, `Controls`, `MiniMap`, `ReactFlow`, etc.) are added (lines 5‑18).  
- **Utility** – `buildNodesById` (lines 39‑46) builds a `Map<string, GraphNode>` for fast lookup.  
- **Layout logic** – `useOverviewLayoutForGraph` (lines 47‑154) constructs layer‑cluster nodes, aggregates edges, runs ELK layout asynchronously, and exposes `{ nodes, edges, layoutStatus }`.  
- **Viewport handling** – `EmbedFitViewOnce` (lines 156‑184) calls `fitView` once after the flow is mounted to avoid infinite loops.  
- **Rendering** – `EmbedOverviewFlow` (lines 186‑218) renders the flow with interactions disabled; `EmbedSizedFlowMount` (lines 220‑257) mounts the flow only when the host element has non‑zero dimensions, using a `ResizeObserver`.  
- **Public API** – `EmbedGraphPanelProps` (lines 259‑261) and `EmbedGraphPanel` (lines 263‑279) expose the panel, showing a “Computing layout…” overlay while `layoutStatus` is `"computing"`.

### Impact  
- **Self‑contained** – no global state, reducing side‑effects.  
- **Asynchronous layout** – ELK runs in a promise; the overlay prevents UI freezes.  
- **Clear separation** – layout, sizing, and rendering are isolated in hooks and small components, easing future maintenance.

### Risks & follow‑ups  
- **Layout accuracy** – verify ELK output for complex graphs; visual regression tests are recommended.  
- **Resize handling** – confirm `ResizeObserver` triggers re‑mount correctly across browsers.  
- **Edge cases** – empty or single‑node graphs fall back to `EMPTY_OVERVIEW`; ensure no crashes.  
- **Styling** – component relies on CSS variables (`--color-edge-dot`, `--glass-bg`); check they exist in all themes.
