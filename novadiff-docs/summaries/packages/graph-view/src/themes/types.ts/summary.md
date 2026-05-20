### Overview  
A new file `packages/graph-view/src/themes/types.ts` (added lines R1‑R36) introduces a type system for graph‑view themes and a default configuration.

### Key changes  
- **`PresetId`** (`"dark-gold" | "dark-ocean" | "dark-forest" | "dark-rose" | "light-minimal"`) – supported preset identifiers.  
- **`AccentSwatch`** – describes an accent set with `id`, `name`, `accent`, `accentDim`, `accentBright`.  
- **`ThemePreset`** – bundles preset metadata, color map, accent swatches, and default accent ID.  
- **`HeadingFont`** – restricts heading fonts to `"serif" | "sans" | "mono"`.  
- **`ThemeConfig`** – runtime theme settings: `presetId`, `accentId`, optional `headingFont`.  
- **`DEFAULT_THEME_CONFIG`** – baseline config (`presetId: "dark-gold"`, `accentId: "gold"`).

### Impact  
- **API surface expansion** – consumers can import and type theme logic with the new symbols.  
- **Centralized defaults** – `DEFAULT_THEME_CONFIG` offers a single source for initial theme values.  
- **No breaking changes** – the file is added; existing code is unaffected unless it imports from this path.  
- **Stronger typing** – the new interfaces reduce runtime errors when handling presets or accents.  
- **No runtime cost** – only type declarations and a small constant are present.

### Risks & follow‑ups  
- **Missing imports** – verify modules that use theme data import from `packages/graph-view/src/themes/types.ts`.  
- **Test coverage** – update tests that rely on theme configuration to reference `DEFAULT_THEME_CONFIG` or the new interfaces.  
- **Documentation** – update README or internal docs to reflect `PresetId` and `ThemeConfig`.  
- **Future extensions** – adding new presets requires updating the `PresetId` union to maintain type safety.
