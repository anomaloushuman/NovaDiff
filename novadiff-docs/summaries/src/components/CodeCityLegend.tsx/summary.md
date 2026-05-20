### Overview  
A new component, `CodeCityLegend`, has been added to `src/components`. It renders a sidebar that displays current view metrics, a legend, and details for a selected building.

### Key changes  
- **Import** – `import type { CodeCityRenderableBuilding } from "../app/codeCityLayout";` (R1).  
- **Export** – `export function CodeCityLegend({ … })` (R3).  
- **Props** –  
  - `selected: CodeCityRenderableBuilding | null` (R12).  
  - `blameOverlay: boolean` (R13).  
  - `rootSide: "baseline" | "target"` (R14).  
  - `visibleBuildingCount`, `districtCount`, `changedBuildingCount` (R15‑17).  
  - Optional `onOpenDiff?: (path: string) => void` (R18).  
- **UI** – Aside element containing:  
  - A metrics grid (root side, building count, district count, changed count).  
  - A legend list with swatches for added, modified, removed, kind, and blame overlay toggle.  
  - A selected‑building card showing name, kind, path, tags, optional diff button, author info, and owners list (R20‑121).

### Impact  
- The component is self‑contained; no existing files are altered.  
- It is a pure functional component, so it re‑renders only when its props change.  
- No new runtime side effects or logs are introduced.  
- It depends on the `CodeCityRenderableBuilding` type; the import path must resolve.

### Risks & follow‑ups  
- **Import resolution** – confirm that `../app/codeCityLayout` exports `CodeCityRenderableBuilding`.  
- **Prop shape** – callers must supply a `selected` object that matches the expected structure; TypeScript will flag mismatches.  
- **Optional callback** – consuming components should handle the absence of `onOpenDiff`.  
- **Styling** – the new CSS classes (`code‑city‑legend`, `code‑city‑swatch‑–added`, etc.) could clash with existing styles; visual regression tests are advised.
