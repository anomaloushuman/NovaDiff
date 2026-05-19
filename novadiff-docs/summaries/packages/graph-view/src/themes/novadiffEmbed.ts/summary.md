### Overview  
A new file `packages/graph-view/src/themes/novadiffEmbed.ts` has been added. It defines a locked theme for NovaDiff documentation embeds.

### Key changes  
- **Import**: `import type { ThemeConfig } from "./types.ts";` (line 1).  
- **Export**: `export const NOVADIFF_EMBED_THEME: ThemeConfig = {` (line 4).  
- **Properties**:  
  - `presetId: "dark-ocean"` (line 5)  
  - `accentId: "purple"` (line 6)  
  - `headingFont: "sans"` (line 7)  
- **Comment**: “Locked theme for NovaDiff documentation embed (matches host App.css tokens).” (line 3).

### Impact  
- Provides a pre‑configured `ThemeConfig` that can be imported by embed components.  
- No new runtime logic is introduced; the file only declares a constant.

### Risks & follow‑ups  
- Verify that `./types.ts` resolves correctly in all build environments.  
- Ensure `NOVADIFF_EMBED_THEME` is referenced where intended (e.g., in embed components).  
- Run linting and TypeScript checks to confirm type correctness.  
- Consider adding a unit test to assert the theme’s properties match the expected token values.
