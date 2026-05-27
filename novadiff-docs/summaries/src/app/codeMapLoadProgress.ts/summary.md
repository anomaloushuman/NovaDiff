### Overview  
`src/app/codeMapLoadProgress.ts` adds a public API for tracking the Code Map loading progress.  
It declares the types `CodeMapGraphProgress`, `CodeMapLoadState`, and `CodeMapLoadSnapshot`, and exports the helpers `computeCodeMapLoadSnapshot`, `isCodeMapExperienceReady`, and the constant `CODE_MAP_HANDOFF_MS` (line 124).

### Key changes  
* **Exports** – new symbols added at the top of the file (lines 1‑6, 8‑16, 18‑24).  
* **Progress calculation** – `graphPercent` (lines 30‑53) maps graph phases and progress ratios to a 0‑100 scale using the constants `GRAPH_END` (52), `CITY_END` (88), and `MOUNT_END` (100).  
* **Snapshot logic** – `computeCodeMapLoadSnapshot` (lines 54‑107) returns a `CodeMapLoadSnapshot` that reflects the current phase (“Knowledge graph”, “Code city”, “Explorer”, or “Ready”) and computes `percent`, `spawnCount`, and `spawnTarget`.  
* **Readiness check** – `isCodeMapExperienceReady` (lines 109‑121) evaluates `graphReady`, `explorerMounted`, `cityReady`, and `graphBuilding` to determine if the experience is ready.  
* **Timing constant** – `CODE_MAP_HANDOFF_MS` (line 124) defines the cross‑fade duration from preview to live view.

### Impact  
* Centralizes progress metrics, reducing duplicated logic across the UI.  
* Provides a single source of truth for progress percentages and readiness flags.  
* Snapshot data can be logged or sent to analytics for monitoring user experience.  
* As a new file, it introduces no breaking changes; existing imports remain unaffected.

### Risks & follow‑ups  
* Verify that `graphPercent` handles edge cases such as `total = 0` or `current > total`.  
* Ensure `computeCodeMapLoadSnapshot` aligns with UI expectations for each phase; unit tests should cover all branches.  
* Confirm that `isCodeMapExperienceReady` logic matches the intended semantics, especially when `graphBuilding` toggles.  
* Update any documentation or type references that now depend on the new `CodeMapLoadState` interface.
