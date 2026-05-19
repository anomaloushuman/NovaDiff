### Overview
`packages/graph-view/src/themes/index.ts` now aggregates theme‑related exports.  
The file adds five lines (R1‑R5) that re‑export symbols from the theme implementation modules.

### Key changes
- **R1**: `export { ThemeProvider, useTheme } from "./ThemeContext.tsx";`
- **R2**: `export { PRESETS, getPreset, getAccent } from "./presets.ts";`
- **R3**: `export { applyTheme } from "./theme-engine.ts";`
- **R4**: `export type { HeadingFont, PresetId, ThemeConfig, ThemePreset, AccentSwatch } from "./types.ts";`
- **R5**: `export { DEFAULT_THEME_CONFIG } from "./types.ts";`

These lines expose the public API for theme configuration, provider, and utilities.

### Impact
- Consumers can import theme symbols from a single entry point:  
  `import { ThemeProvider } from 'graph-view/themes';`
- No new runtime logic is introduced; the file only re‑exports existing modules.
- The public surface is now centralized, simplifying discoverability and maintenance.
- The file must be part of the package’s public API (e.g., referenced in `src/index.ts` or `package.json`).

### Risks & follow‑ups
- Verify that `packages/graph-view/src/themes/index.ts` is emitted in the build output; missing it will break imports.
- Run unit tests that import these symbols to ensure they resolve correctly.
- Ensure re‑exported types do not collide with existing global types.
- Confirm that the new exports do not expose internal implementation details that should remain private.
