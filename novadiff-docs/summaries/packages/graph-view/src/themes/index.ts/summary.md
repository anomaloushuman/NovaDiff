### Overview
A new module `packages/graph-view/src/themes/index.ts` has been added. It consolidates exports from several internal files into a single public surface.

### Key changes
- `export { ThemeProvider, useTheme } from "./ThemeContext.tsx";` – re‑exports the context provider and hook.  
- `export { PRESETS, getPreset, getAccent } from "./presets.ts";` – exposes preset data and helper functions.  
- `export { applyTheme } from "./theme-engine.ts";` – provides the runtime theme application logic.  
- `export type { HeadingFont, PresetId, ThemeConfig, ThemePreset, AccentSwatch } from "./types.ts";` – re‑exports core type definitions.  
- `export { DEFAULT_THEME_CONFIG } from "./types.ts";` – exposes the default configuration object.  

These lines are added at the top of the file (diff lines 1‑5).

### Impact
- **Correctness**: Consumers can now import theme utilities directly from `packages/graph-view/src/themes`.  
- **Maintainability**: Centralizes theme exports, reducing import churn across the codebase.  
- **Compatibility**: No breaking changes are introduced; the new file only adds exports.  
- **Observability**: The module only re‑exports existing functionality, so no new runtime behavior is added.

### Risks & follow‑ups
- Verify that `ThemeContext.tsx`, `presets.ts`, `theme-engine.ts`, and `types.ts` compile and are included in the build (unknown from the available diff/scan evidence).  
- Ensure the new exports do not shadow existing symbols in other modules.  
- Run the existing test suite to confirm that no tests fail due to the added public surface (unknown from the available diff/scan evidence).  
- Check that the documentation generator picks up the new exports for API docs.
