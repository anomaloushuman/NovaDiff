### Overview  
`packages/graph-view/src/themes/novadiffEmbed.ts` replaces the static export `NOVADIFF_EMBED_THEME` (lines 3‑4) with a runtime resolver `resolveNovaDiffEmbedTheme`. The resolver selects a dark or light theme based on the browser’s `prefers-color-scheme` media query, defaulting to the dark theme when the query is unavailable.

### Key changes  
- Removed the exported constant `NOVADIFF_EMBED_THEME`.  
- Added `EMBED_DARK_THEME` (lines 3‑7) and `EMBED_LIGHT_THEME` (lines 9‑13).  
  - Dark theme: `presetId: "dark-ocean"`, `accentId: "purple"`, `headingFont: "sans"`.  
  - Light theme: `presetId: "light-minimal"`, `accentId: "ocean"`, `headingFont: "sans"`.  
- Introduced `export function resolveNovaDiffEmbedTheme(): ThemeConfig` (lines 19‑26) that returns the appropriate theme.  
- Updated the comment block (lines 15‑18) to describe dynamic resolution.  
- The file now exposes only the resolver function.

### Impact  
- **Breaking change**: Imports of `NOVADIFF_EMBED_THEME` will fail; callers must use `resolveNovaDiffEmbedTheme()`.  
- **Runtime behavior**: Theme selection adapts to the user’s OS/browser color scheme via `window.matchMedia("(prefers-color-scheme: light)")`.  
- **Fallback**: If `window.matchMedia` is unavailable, the function returns the dark theme.  
- **Performance**: A single `matchMedia` call per resolution; negligible overhead.  
- **Testing**: Tests that relied on the static theme may need to be updated to account for the dynamic resolver.

### Risks & follow‑ups  
- Search the codebase for `NOVADIFF_EMBED_THEME` imports and replace them with calls to `resolveNovaDiffEmbedTheme()`.  
- Verify that any documentation or README references to the old constant are updated.  
- Ensure target browsers support `window.matchMedia`; the fallback covers missing support.
