### Overview
A new `store.ts` file was added to `packages/graph-view/src`.  
It introduces a Zustand store (`useDashboardStore`) that holds the entire graph‑view state, along with a set of exported types and helper functions.

### Key changes
- **Imports (lines 1‑10)** – `create` from `zustand`, `SearchEngine`, `SearchResult`, `GraphIssue`, `GraphNode`, `KnowledgeGraph`, `TourStep`, and `ReactFlowInstance`.  
- **Exported types (lines 12‑17)** – `Persona`, `NavigationLevel`, `NodeType`, `Complexity`, `EdgeCategory`, `ViewMode`, `DetailLevel`.  
- **`DashboardStore` interface (lines 100‑243)** – defines all state fields and action signatures.  
- **Helper functions**  
  - `buildGraphIndexes` (lines 74‑95) builds `nodesById`, `nodeIdToLayerId`, and `nodeIdToLayerIds`.  
  - `getSortedTour` (lines 244‑247) sorts tour steps.  
  - `navigateTourToLayer` (lines 250‑263) returns `{ navigationLevel, activeLayerId }` when a node ID is found.  
  - `layerResetIfChanged` (lines 274‑289) clears layout caches when `activeLayerId` changes.  
- **Store implementation (lines 291‑823)** – wires all actions, initializes state, and updates indexes on `setGraph`.

### Impact
- **State centralisation** – all UI components now read/write through a single store, reducing duplication.  
- **Index consistency** – `buildGraphIndexes` guarantees that navigation and filtering use the same node‑to‑layer maps.  
- **Cache hygiene** – `layerResetIfChanged` ensures stale layout data is purged when the active layer changes.  
- **Performance** – indexes are rebuilt on every `setGraph`; this is
