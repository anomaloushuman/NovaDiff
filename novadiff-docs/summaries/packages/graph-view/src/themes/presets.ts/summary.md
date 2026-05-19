### Overview  
`packages/graph-view/src/themes/presets.ts` is a new module that defines theme data and helper functions. The file adds imports, two accent swatch arrays, a preset collection, and lookup utilities.

### Key changes  
- **File added**: `packages/graph-view/src/themes/presets.ts` (lines 1‑183).  
- **Imports**: `import type { AccentSwatch, ThemePreset } from "./types.ts";` (line 1).  
- **Accent swatches**:  
  - `DARK_ACCENT_SWATCHES` (lines 3‑12).  
  - `LIGHT_ACCENT_SWATCHES` (lines 14‑23).  
- **Preset collection**: `export const PRESETS: ThemePreset[] = [...]` (lines 25‑171) contains dark and light presets with color palettes.  
- **Lookup helpers**:  
  - `export function getPreset(id: string)` (lines 173‑175) returns the preset matching `id` or the first preset if none match.  
  - `export function getAccent(preset, accentId)` (lines 177‑183) returns an accent swatch by `accentId`, falling back to the preset’s default or the first swatch.

### Impact  
- **Deterministic fallback**: Both helpers guarantee a return value, preventing `undefined` results.  
- **Centralized data**: All theme definitions live in a single array, simplifying future additions.  
- **Linear lookup**: Uses `Array.find`, which is acceptable for the small preset set shown.

### Risks & follow‑ups  
- **Duplicate IDs**: The code does not check for duplicate `id` values; duplicates could cause unexpected fallbacks.  
- **Test coverage**: No tests are present for `getPreset` or `getAccent`; adding unit tests would confirm fallback behavior.  
- **Build validation**: Run lint, TypeScript compilation, and the production build to ensure the new imports resolve correctly.  
- **Scalability**: If the preset list grows, consider indexing by `id` for O(1) lookup.
