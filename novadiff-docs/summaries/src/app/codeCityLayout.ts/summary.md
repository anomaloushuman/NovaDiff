### Overview  
`src/app/codeCityLayout.ts` is a new module that implements a layout engine for the CodeCity visualizer. It exports four public interfaces (`CodeCityFilters`, `CodeCityRenderableDistrict`, `CodeCityRenderableBuilding`, `CodeCityLayoutResult`) and a `buildCodeCityLayout` function that converts a `CodeCityModel` into renderable districts and buildings.

### Key changes  
- **Imports** (lines 1‑8): pulls `CodeCityChangeState`, `CodeCityFileNode`, `CodeCityModel`, `CodeCityOwnershipSummary`, `CodeCityRootSide`, `CodeCitySymbolNode` from `./types`.  
- **Interfaces** (lines 10‑55): define filter options and the shape of the layout output.  
- **Utility functions** (lines 68‑106):  
  - `hashColor` – deterministic hash to RGB.  
  - `kindColor` – maps symbol kind to a base color.  
  - `changeEmissive` – maps change state to an emissive value.  
  - `buildingHeight` – computes height from line count.  
  - `visibleForRoot` – determines visibility based on root side and overlay flags.  
- **`buildCodeCityLayout`** (lines 129‑283):  
  - Returns empty arrays if `model` is `null`.  
  - Builds a file map, filters symbols according to `CodeCityFilters`, groups them by district and file, and calculates 3‑D coordinates for districts and buildings.  
  - Sets dimensions, colors, emissive values, and ghost status based on the symbol’s properties and the filter settings.

### Impact  
- The module is self‑contained; it does not modify existing code.  
- All new types and the layout function are exported, keeping the public surface explicit.  
- The implementation follows a single pass over symbols and files, yielding deterministic output.

### Risks & follow‑ups  
- **Type compatibility**: ensure `CodeCitySymbolNode` and `CodeCityFileNode` expose the properties used (`rootSide`, `changeState`, `lineCount`, etc.).  
- **Rendering assumptions**: verify that the constants (`BUILDING_STEP`, `FILE_BLOCK_SIZE`) match the renderer’s expectations.  
- **Test coverage**: add unit tests for `buildCodeCityLayout` to guard against regressions in filtering logic.  
- **Linting & build**: run `npm run lint`, `npm test`, and `npm run build` to confirm the new file passes all checks.
