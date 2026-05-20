### Overview  
A new file, `packages/graph-view/src/themes/novadiffEmbed.ts`, has been added. It defines a locked theme for NovaDiff documentation embeds.

### Key changes  
- **Import** (R1): `import type { ThemeConfig } from "./types.ts";`  
- **Comment** (R3): “Locked theme for NovaDiff documentation embed (matches host App.css tokens).”  
- **Export** (R4): `export const NOVADIFF_EMBED_THEME: ThemeConfig = { … }`  
- **Theme properties** (R5‑R7):  
  - `presetId: "dark-ocean"`  
  - `accentId: "purple"`  
  - `headingFont: "sans"`  

### Impact  
- The theme is type‑safe via `ThemeConfig`.  
- Centralizes configuration; future changes can be made in a single file.  
- No existing code is altered, so no breaking changes are introduced.  
- The file contains only a constant export—no runtime side effects.

### Risks & follow‑ups  
- **Usage verification**: unknown from the available diff/scan evidence; confirm that `NOVADIFF_EMBED_THEME` is imported where documentation embeds are rendered.  
- **Token alignment**: unknown from the available diff/scan evidence; ensure the preset, accent, and font match the host `App.css` tokens.  
- **Documentation**: update any relevant docs or README sections to reference the new export.  
- **Linting**: run the repo’s linting suite to verify no style violations in the new file.
