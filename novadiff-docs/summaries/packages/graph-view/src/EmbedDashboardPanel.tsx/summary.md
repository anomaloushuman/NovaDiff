### Overview  
A new file `packages/graph-view/src/EmbedDashboardPanel.tsx` adds an embed dashboard panel. It imports React hooks, `ReactFlowProvider`, Flow CSS, `GraphIssue` type, `DashboardContent`, `useDashboardStore`, `ThemeProvider`, and `NOVADIFF_EMBED_THEME`. The panel renders dashboard content inside a resizable container.

### Key changes  
- **Imports (R5‑R10)**: added `useEffect`, `useRef`, `useState` from React; `ReactFlowProvider` from `@xyflow/react`; Flow CSS; `GraphIssue` type; `DashboardContent`; `useDashboardStore`; `ThemeProvider`; `NOVADIFF_EMBED_THEME`.  
- **`EmbedSizedDashboard` (R16‑R63)**: new component that measures its host div with a `ResizeObserver` and passes `width`/`height` to `ReactFlowProvider`.  
- **`EmbedDashboardPanelProps` (R64‑R68)**: interface exposing optional `accessToken` and `graphIssues`.  
- **`EmbedDashboardPanel` (R69‑R95)**: uses `useDashboardStore` to get `graph`; wraps content in `ThemeProvider`; conditionally renders `EmbedSizedDashboard` with `DashboardContent` or a loading overlay.

### Impact  
- **Bundle size**: includes `@xyflow/react` and its CSS.  
- **Performance**: `ResizeObserver` may trigger frequent updates; dimensions are memoized.  
- **Styling**: Flow CSS import is required; missing it will break layout.  
- **API surface**: new component and props must be imported from the new file.

### Risks & follow‑ups  
- Verify `@xyflow/react` is a dependency and its CSS is bundled.  
- Ensure `useDashboardStore` provides a `graph` before rendering; otherwise the overlay may flicker.  
- Test the component with `NOVADIFF_EMBED_THEME` in light and dark modes.  
- Confirm `ro.disconnect()` runs on unmount to avoid memory leaks.
