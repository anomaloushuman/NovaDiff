### Overview  
The layout generator now supports richer filtering. The `CodeCityFilters` interface was extended to replace the single `symbolKind` string with a `symbolKinds: SymbolKindGroup[]` array and to add a `changeStates: CodeCityChangeState[]` array. New helper functions `normalizeRelPath` and `fileMatchesSubsystem` were added to centralise path handling. A `districtScoped` flag (lines 171‑175) short‑circuits subsystem/extension checks when the filters are all “all”.

### Key changes  
- **Imports** (lines 1‑5): `changeStateMatchesFilters`, `symbolMatchesKindGroups`, and `SymbolKindGroup` from `./docsExploreFilters`.  
- **Interface update** (lines 22‑25): `symbolKinds` and `changeStates` added; `symbolKind` removed (line 17).  
- **Path helpers** (lines 120‑135): `normalizeRelPath` and `fileMatchesSubsystem`.  
- **Visibility logic** (lines 178‑181): `fileMatchesSubsystem` replaces direct path checks.  
- **Symbol kind filtering** (lines 193‑196): uses `symbolMatchesKindGroups`.  
- **Change‑state filtering** (lines 196‑198): uses `changeStateMatchesFilters`.  
- **Author & search** (lines 199‑206, 210‑214): author match logic and a case‑insensitive search over file path, symbol name, and kind.  
- **Result shape** (lines 317‑322): returns `districts`, `buildings`, `subsystems`, `extensions`, and `symbolKinds`.

### Impact  
- **Correctness**: Filters now honor grouped symbol kinds and change states; subsystem matching handles both relative and absolute paths.  
- **Maintainability**: Centralised path logic reduces duplication; the filter interface more clearly expresses intent.  
- **Compatibility**: Code that still references `symbolKind` will fail to compile; UI and tests must migrate to `symbolKinds`.  
- **Performance**: Minor overhead from helper calls; `districtScoped` cuts unnecessary checks for large models.

### Risks & follow‑ups  
- **API breakage**: Verify all callers update from `symbolKind` to `symbolKinds`.  
- **Subsystem logic**: Test `fileMatchesSubsystem` on nested subsystems and mixed path separators.  
- **Empty filter arrays**: Ensure `symbolMatchesKindGroups` and `changeStateMatchesFilters` treat empty arrays as “all”.  
- **Regression**: Run existing layout unit tests to confirm visual and data integrity.
