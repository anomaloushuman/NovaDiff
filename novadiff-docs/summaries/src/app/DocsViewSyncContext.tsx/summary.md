### Overview  
In `src/app/DocsViewSyncContext.tsx` a new state `cityBuildingId` was added to the `DocsViewSyncState` interface (R16‑17) and initialized to `null` (R43). The provider now tracks this ID when a graph node id is unknown or not yet linked.

### Key changes  
- **Interface** – `cityBuildingId: string | null` (R16‑17).  
- **State** – `const [cityBuildingId, setCityBuildingId] = useState<string | null>(null);` (R43).  
- **Selection logic** –  
  - `setSelectionFromGraph` now clears `cityBuildingId` when a node id is present and no longer resets `enteredBuilding` on falsy ids (L49‑50 removed, R52‑57 added).  
  - `setSelectionFromCity` assigns `cityBuildingId = building.id` when a building is supplied and removes the old `building !== undefined` guard (R62‑70, R72).  
- **Enter/exit/clear helpers** – update `cityBuildingId` (R84, R94, R100).  
- **Context value** – includes `cityBuildingId` and its dependency array is updated (R113‑128).

### Impact  
- **Consistency** – a single source of truth for the building id when the graph node is missing.  
- **Maintainability** – consumers can rely on `cityBuildingId` without extra logic.  
- **Compatibility** – TypeScript will enforce handling of the new field; existing consumers receive an additional property.  
- **Performance** – negligible overhead from an extra state setter.

### Risks & follow‑ups  
- **Regression** – components that previously cleared `enteredBuilding` on falsy `nodeId` may behave differently; review related logic.  
- **Type safety** – ensure all destructurings import the updated `DocsViewSyncState`.  
- **Dependency array** – confirm `cityBuildingId` is listed in `useMemo` dependencies to avoid stale closures.  
- **Testing** – add unit tests for `setSelectionFromGraph` and `setSelectionFromCity` to assert the new `cityBuildingId` handling.
