### Overview  
A new file `packages/graph-view/src/themes/presets.ts` was added. It defines theme presets and helper functions for the graph view component.

### Key changes  
- Import of types: `import type { AccentSwatch, ThemePreset } from "./types.ts";` (line 1).  
- Accent swatch constants: `DARK_ACCENT_SWATCHES` and `LIGHT_ACCENT_SWATCHES` (lines 3‑23).  
- Preset collection: `export const PRESETS: ThemePreset[]` (lines 25‑171) lists eight presets with dark/light variants and associated accent swatches.  
- Utility functions:  
  - `export function getPreset(id: string)` (lines 173‑175) returns the preset with the given id or falls back to the first preset.  
  - `export function getAccent(preset: ThemePreset, accentId: string)` (lines 177‑183) returns the matching accent swatch, or falls back to the preset’s default accent, or the first swatch.

### Impact  
- The fallback logic in `getPreset` and `getAccent` prevents undefined values when an id is missing.  
- Centralizing theme data reduces duplication; new themes can be added by extending `PRESETS`.  
- No existing modules are modified; the file is purely additive.

### Risks & follow‑ups  
- Verify that other modules import the correct relative path (`./themes/presets.ts`).  
- Add unit tests for `getPreset` and `getAccent` to confirm fallback behavior.  
- If the preset list grows, consider memoizing lookups to avoid repeated linear scans.  
- Ensure `ThemePreset` and `AccentSwatch` definitions in `./types.ts` remain compatible with the new data structure.
