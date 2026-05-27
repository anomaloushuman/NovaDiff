### Overview  
A new file `src/app/graphicsPerformance.ts` (lines R1‑R16) introduces a single quality profile for docked + expanded code‑city rendering. It defines a threshold constant and two helper functions that adjust pixel density and decide when to omit decorative window meshes.

### Key changes  
- **Exported constant** `CITY_OMIT_WINDOWS_BUILDINGS = 900` (R4) – the building count above which window details are suppressed.  
- **Function** `cityPixelRatio(buildingCount: number): number` (R6‑R12) –  
  - Uses `window.devicePixelRatio` if available, otherwise defaults to 1.  
  - Caps the ratio at 1.5 for ≥2000 buildings, otherwise at 2.  
- **Function** `shouldOmitWindowDetail(buildingCount: number): boolean` (R14‑R16) – returns `buildingCount >= CITY_OMIT_WINDOWS_BUILDINGS`.  
- **Documentation comments** (R1‑R3) explain the module’s purpose and threshold logic.

### Impact  
- **Performance**: Capping pixel density and omitting window meshes above a configurable threshold reduces rendering load for large cities.  
- **Maintainability**: Centralizes graphics tuning in one file, simplifying future adjustments.  
- **Compatibility**: The `window` guard ensures the module works in non‑browser environments (SSR, tests).  

### Risks & follow‑ups  
- **Threshold tuning**: The hard‑coded `900` may not suit all use cases; its appropriateness for real‑world city sizes is unknown from the diff.  
- **Device pixel ratio fallback**: In environments without `window`, the fallback of `1` may under‑render; tests should cover this path.  
- **Integration**: Verify that the new functions are imported and used by the rendering pipeline; otherwise the file remains unused.  
- **Build lint**: Run `npm run lint`, `npm test`, and `npm run build` to catch any TypeScript or import errors introduced by the new module.
