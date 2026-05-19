### Overview  
A new file `packages/graph-view/src/themes/types.ts` (lines 1‑36) adds a type‑safe theme system for the graph view component.

### Key changes  
- `export type PresetId = …` (lines 1‑6) lists supported preset identifiers.  
- `export interface AccentSwatch` (lines 8‑13) defines accent color metadata.  
- `export interface ThemePreset` (lines 16‑22) bundles preset metadata, colors, accent swatches, and a default accent ID.  
- `export type HeadingFont = "serif" | "sans" | "mono"` (line 25) restricts heading font choices.  
- `export interface ThemeConfig` (lines 27‑31) captures runtime theme configuration.  
- `export const DEFAULT_THEME_CONFIG: ThemeConfig` (lines 33‑36) provides a baseline configuration (`presetId: "dark-gold"`, `accentId: "gold"`).

### Impact  
- **Correctness**: Type definitions prevent misuse of preset identifiers and accent data.  
- **Maintainability**: Centralized theme definitions simplify adding or updating presets.  
- **Compatibility**: As a new module, it introduces no breaking changes; existing code remains unaffected unless it imports from this file.

### Risks & follow‑ups  
- Verify that components consuming theme data import the correct types from this file.  
- Ensure that preset identifiers used elsewhere match the `PresetId` union to avoid type errors.  
- Run the repository’s lint, test, and production build scripts to confirm no new TypeScript errors.
