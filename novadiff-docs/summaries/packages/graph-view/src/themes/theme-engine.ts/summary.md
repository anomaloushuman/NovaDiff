### Overview  
A new `theme-engine.ts` file was added at `packages/graph-view/src/themes/`. It centralizes theme application and teardown logic for the graph‑view component.

### Key changes  
- **Imports** (lines 1‑2): `ThemeConfig` type and `getAccent`, `getPreset` helpers.  
- **`hexToRgb`** (lines 4‑8): converts a hex string to an `"R, G, B"` string used for RGBA values.  
- **`deriveFromAccent`** (lines 10‑30): builds a set of derived CSS variables (e.g., `color-border-subtle`, `glass-bg`) based on an accent color and a dark‑mode flag.  
- **`applyTheme`** (lines 34‑69):  
  - Applies preset colors (`--color-…`).  
  - Sets accent variables (`--color-accent`, `--color-accent-dim`, `--color-accent-bright`).  
  - Adds derived variables via `deriveFromAccent`.  
  - Sets `data-theme` attribute and heading‑font CSS variable.  
- **`clearTheme`** (lines 72‑90): removes all theme‑related inline styles and the `data-theme` attribute, enabling clean teardown.

### Impact  
- **Consistency**: All theme logic lives in one module, ensuring uniform CSS variable names and values across themes.  
- **Performance**: Only a handful of `style.setProperty`/`removeProperty` calls per theme; negligible runtime cost.  
- **Compatibility**: Uses standard CSS custom properties; no browser‑specific code.

### Risks & follow‑ups  
- `hexToRgb` has no validation; test with malformed hex strings to avoid runtime errors.  
- `applyTheme` defaults to `"serif"` when `config.headingFont` is missing; confirm this matches design expectations.  
- `clearTheme` must remove every property added by `applyTheme`; run integration tests after theme switches.  
- Verify that `getPreset` and `getAccent` return the expected objects against existing preset data.
