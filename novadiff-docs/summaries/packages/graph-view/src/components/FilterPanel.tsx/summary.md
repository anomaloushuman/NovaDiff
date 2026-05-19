### Overview  
A new `FilterPanel` component is added at **packages/graph-view/src/components/FilterPanel.tsx** (lines 1‑219). It imports React hooks, store constants, and an i18n context, then exposes a button that toggles a dropdown containing checkboxes for node types, complexities, layers, and edge categories, plus a reset button.

### Key changes  
- **Imports** – `useEffect`, `useRef` from React; store hooks and constants (`ALL_NODE_TYPES`, `ALL_COMPLEXITIES`, `ALL_EDGE_CATEGORIES`); and `useI18n` (diff lines R1‑R4).  
- **Store access** – `useDashboardStore` reads `graph`, `filters`, `setFilters`, `resetFilters`, `hasActiveFilters`, `filterPanelOpen`, and `toggleFilterPanel` (diff line R6‑R13).  
- **Outside‑click handling** – a `useEffect` registers a `mousedown` listener that closes the panel when a click occurs outside `containerRef` (diff lines R23‑R34).  
- **Toggle helpers** – `toggleNodeType`, `toggleComplexity`, `toggleLayer`, `toggleEdgeCategory` each clone the relevant `Set`, modify it, and call `setFilters` (diff lines R36‑R74).  
- **UI** – a button changes style when `isActive` (derived from `hasActiveFilters()`), and the dropdown lists checkboxes bound to the `Set` values, with a reset button shown only when `isActive` (diff lines R78‑R213).  
- **Export** – `export default function FilterPanel()` (diff line R6).

### Impact  
The component relies entirely on the dashboard store; any mismatch in the store shape will surface at runtime. It is lightweight, but each toggle triggers a store update that may re‑render all consumers.

### Risks & follow‑ups  
- **Store contract** – confirm that `useDashboardStore` returns the expected functions and that `filters` contains the required `Set` properties.  
- **Outside‑click listener** – ensure the `mousedown` handler is removed on unmount to avoid leaks.  
- **Styling** – verify that Tailwind classes such as `bg-gold/20` and `glass` exist in the theme.  
- **Testing** – add unit tests for the toggle helpers and integration tests for panel visibility and filter updates.
