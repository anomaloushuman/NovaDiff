### Overview
In `src/components/DocumentationWorkspaceLinked.tsx`, the `useLinkedCityState` hook now treats `sync.cityBuildingId` as an additional source of selection. The hook’s public API now exposes `primaryBuildingId`, which falls back to `sync.cityBuildingId` when no primary building is found. This change expands the link between the graph and city views to include building‑level navigation.

### Key changes
- **Selection logic** – `selectionActive` is now `Boolean(sync.linkedNodeId) || Boolean(sync.cityBuildingId)` (L84 → R84).  
- **Highlight calculation** – `cityBuildingIdsForHighlight` receives `sync.cityBuildingId` (R94, R101).  
- **Primary building fallback** – `primaryBuildingId` is set to `primary ?? sync.cityBuildingId` (R166).  
- **Return shape** – `primaryBuildingId` is added to the hook’s return object (L164 removed, R166 added).  
- **Sync usage** – `sync.cityBuildingId` is read in several places, enabling building‑level sync.

### Impact
- **Correctness** – Highlights and focus now work when the graph selection is cleared but a building ID remains, preventing stale highlights.  
- **Maintainability** – Consumers that destructure the hook’s result must account for the new `primaryBuildingId` field.  
- **Performance** – The added boolean check and argument to `cityBuildingIdsForHighlight` add negligible overhead.  
- **Observability** – Toolbar and link hints now reflect building‑level navigation, improving UX consistency.

### Risks & follow‑ups
- **Consumer breakage** – Code that previously ignored `primaryBuildingId` may now receive an unexpected value; run unit tests for all hook consumers.  
- **Sync consistency** – Verify that `sync.cityBuildingId` is correctly set and cleared during graph selection changes to avoid orphaned highlights.  
- **Edge overlay regression** – Ensure that `graphEdgesToCityPairs` still receives the correct `buildingByNode` mapping when `cityBuildingId` is used.  
- **Documentation** – Update docs to explain the new `primaryBuildingId` fallback and the expanded selection logic.
