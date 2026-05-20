### Overview
A brand‑new `packages/graph-view/src/store.ts` file introduces a Zustand‑based state store for the graph view, along with a suite of helper types and functions for graph indexing, tour navigation, and layout caching.

### Key changes
- **New imports**: `zustand`, `SearchEngine`, `SearchResult`, `GraphIssue`, `ReactFlowInstance`, and `PROJECT_WIDE_LAYER_ID` from `./utils/activeLayer`.  
- **Public types**: `Persona`, `NavigationLevel`, `NodeType`, `Complexity`, `EdgeCategory`, `ViewMode`, `DetailLevel`, and `FilterState` (lines 21‑74).  
- **Graph indexing**: `buildGraphIndexes` (lines 75‑95) creates `nodesById`, `nodeIdToLayerId`, and `nodeIdToLayerIds` maps.  
- **Tour helpers**: `getSortedTour` (lines 249‑251), `navigateTourToLayer` (lines 255‑267), and `layerResetIfChanged` (lines 279‑293) manage tour state and reset layout caches when the active layer changes.  
- **Store definition**: `DashboardStore` interface (lines 101‑247) and `useDashboardStore` (lines 296‑858) expose state slices and actions for graph loading, navigation, filtering, diff overlay, tour control, view mode, and container layout caching.  
- **Layout issue handling**: `appendLayoutIssues` and `clearLayoutIssues` (lines 845‑857) aggregate ELK repair warnings.

### Impact
- **Correctness**: The new store centralises graph‑related state, reducing duplicated logic in components.  
- **Maintainability**: All state mutations are now typed and encapsulated; future extensions can add actions without touching component logic.  
- **Performance**: Large `Map` structures are rebuilt on `setGraph`; careful to avoid unnecessary re‑renders by resetting caches only when needed (e.g., `layerResetIfChanged`).  
- **Compatibility**: Existing components must import `useDashboardStore` instead of previous ad‑hoc state; missing imports will surface at compile time.  
- **Observability**: `layoutIssues` and `appendLayoutIssues` provide a single source for ELK warnings, simplifying debugging.

### Risks & follow‑ups
- **Tour navigation regressions**: Verify that `navigateTourToLayer` correctly sets `navigationLevel` and `activeLayerId` for all tour steps.  
- **Cache invalidation**: Ensure `layerResetIfChanged` clears caches only when the layer actually changes; accidental resets could degrade layout performance.  
- **Filter defaults**: `DEFAULT_FILTERS` uses `new Set` copies; confirm that mutations in actions (`setFilters`, `resetFilters`) do not leak shared references.  
- **Type exposure**: The new public types (`Persona`, `NavigationLevel`, etc.) are exported; confirm no naming clashes with existing modules.
