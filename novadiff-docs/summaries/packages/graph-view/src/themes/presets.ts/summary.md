### Overview  
In `packages/graph-view/src/themes/presets.ts` the **`light-minimal`** preset’s color palette was replaced.  
- Lines 149‑160 were removed: the old hex values for `root`, `surface`, `elevated`, `panel`, `text-primary`, `text-secondary`, `text-muted`, and all `node‑*` colors.  
- The same lines now contain new hex codes (e.g., `root: "#eaf1fb"`, `surface: "#ffffff"`, `node-file: "#2f6283"`).  
- No other presets, imports, or helper functions were altered.

### Key changes  
- **Preset update** – `colors` for `id: "light-minimal"` now uses the new values shown in the diff.  
- **Removed lines** – the previous palette (e.g., `root: "#f5f3f0"`, `node-file: "#3a6a87"`) is deleted.  
- **Added lines** – new palette values are inserted at the same location.  
- **Scope** – only the `light-minimal` preset is affected; all other code remains unchanged.

### Impact  
- **UI appearance** – the visual style of the light‑minimal theme will change wherever `PRESETS` is used.  
- **Tests** – any assertions or snapshots that reference the old color values must be updated.  
- **Functionality** – the change is purely cosmetic; API behavior and logic are unaffected.  
- **Contrast** – unknown from the available diff/scan evidence; a review may be needed.

### Risks & follow‑ups  
- **Visual regression** – verify that snapshot or visual tests reflect the new colors.  
- **Contrast compliance** – run automated audits to ensure text and node colors meet WCAG 2.1 AA.  
- **Documentation** – update any docs or design tokens that mention the old `light-minimal` palette.  
- **Component usage** – confirm that components consuming `PRESETS` correctly pick up the updated palette without caching stale values.
