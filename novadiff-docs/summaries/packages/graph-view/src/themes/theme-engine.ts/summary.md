### Overview
A new file `packages/graph-view/src/themes/theme-engine.ts` introduces a lightweight theme system.  
It defines a `hexToRgb` helper (R4‑R7), a `deriveFromAccent` routine that builds RGBA values from an accent hex and dark‑mode flag (R10‑R30), and two public functions: `applyTheme` (R34‑R69) and `clearTheme` (R72‑R90). The file imports the `ThemeConfig` type from `./types.ts` and the `getAccent` / `getPreset` helpers from `./presets.ts` (R1‑R2).

### Key changes
- **Imports** – `ThemeConfig` and preset helpers added (R1‑R2).  
- **Utility** – `hexToRgb` converts a hex string to an RGB string (R4‑R7).  
- **Derived values** – `deriveFromAccent` returns a record of RGBA strings based on an accent hex and a dark‑mode flag (R10‑R30).  
- **Theme application** – `applyTheme` writes preset colors, accent colors, derived values, a `data-theme` attribute, and a heading‑font CSS variable to the target element’s style (R34‑R69).  
- **Teardown** – `clearTheme` removes all CSS variables written by `applyTheme` and the `data-theme` attribute (R72‑R90).

### Impact
- **Centralization** – Theme logic is now in a single module, reducing duplication across components.  
- **Simplicity** – Operations are straightforward DOM style updates; the code uses only standard CSS custom properties and attributes.  
- **Extensibility** – Future presets or accent logic can be updated in one place.

### Risks & follow‑ups
- `hexToRgb` may misbehave with malformed hex strings (e.g., missing `#` or wrong length).  
- `clearTheme` must remove every property set by `applyTheme`; missing keys could leave stale styles.  
- Verify that `applyTheme` respects the default `target` (`document.documentElement`) when invoked from a standalone graph view.  
- Run linting and unit tests to catch any type mismatches introduced by the new imports.
