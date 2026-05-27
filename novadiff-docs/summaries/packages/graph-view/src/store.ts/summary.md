### Overview
`packages/graph-view/src/store.ts` now tracks an embedded‑graph filter that can be synced with Code City node selections. The store adds a new state field, an action to update it, and clears layout caches when the filter or active layer changes.

### Key changes
- Added `embedCityFilterNodeIds: Set<string> | null` to `DashboardStore` (R160‑163) and initialized it to `null` in the store (R378‑405).  
- Implemented `setEmbedCityFilterNodeIds(ids)` (R379‑380) to update the filter set, skip redundant updates, and clear layout caches (`containerLayoutCache`, `containerSizeMemory`, `expandedContainers`, `pendingFocusContainer`).  
- Introduced `layerResetIfChanged` helper (lines 285‑303) that clears container caches when the active layer changes.  
- Updated `resetEmbedOverlays` to set `embedCityFilterNodeIds` to `null` (R684).  
- Adjusted `setGraph` and navigation actions to reset caches when the graph or view mode changes.

### Impact
- External components can now sync Code City filter selections to the embedded graph via `setEmbedCityFilterNodeIds`.  
- Layout caches are invalidated automatically on filter or layer changes, reducing stale visualizations.  
- Resetting overlays restores a clean state, including the filter set.

### Risks & follow‑ups
- Verify that `Set<string>` comparisons correctly detect changes; identical sets should not trigger unnecessary cache clears.  
- Monitor performance during rapid filter updates to ensure cache clearing does not cause regressions.  
- Run lint, tests, and production build to confirm integration stability.
