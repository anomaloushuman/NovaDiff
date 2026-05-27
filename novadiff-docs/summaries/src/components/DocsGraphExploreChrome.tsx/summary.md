### Overview
- `src/components/DocsGraphExploreChrome.tsx` now uses typed arrays for filter props instead of single strings.  
- New imports were added at the top of the file:  
  - `CodeCityViewportProvider` from `../app/CodeCityViewportContext` (R15).  
  - `ALL_CHANGE_STATE_FILTERS`, `ALL_SYMBOL_KIND_GROUPS`, `changeStatesFilterActive`, `symbolKindsFilterActive` from `../app/types` (R18‑R27).

### Key changes
- **Imports (R15‑R27)** – added the imports above.  
- **Props interface (R44‑R73)** – `CityExploreBarProps` now declares `citySymbolKinds: SymbolKindGroup[]`, `cityChangeStates: CodeCityChangeState[]`, and corresponding setter props.  
- **Filter counting (R61‑R105)** – `countActiveCityFilters` now uses `symbolKindsFilterActive` and `changeStatesFilterActive` to compute the number of active filters.
