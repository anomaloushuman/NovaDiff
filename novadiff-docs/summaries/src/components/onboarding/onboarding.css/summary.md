### Overview  
`src/components/onboarding/onboarding.css` now expands the commit list to full height, adjusts row padding, and introduces new overlay styles for a product tour and shortcuts help panel.

### Key changes  
- **Commit list sizing** – `.git-history-commit-list` `max-height` changed from `320px` (line 194 removed) to `100%` (line 194 added).  
- **Row padding** – `.git-history-commit-row` padding updated from `8px 0` (line 202 removed) to `10px` (line 202 added).  
- **Product tour UI** – new `.product-tour-overlay` and `.product-tour-card` blocks added (lines 264‑282).  
- **Shortcuts help UI** – new `.shortcuts-help-overlay` and `.shortcuts-help-panel` styles added (lines 309‑326).  
- **Overlay styling** – new overlays use `z-index: 12000` and `11000`, with `backdrop-filter: blur(4px)` for the product tour overlay (line 272).

### Impact  
- The commit list now occupies the full available height, which may affect scrolling in narrow viewports.  
- Padding change improves spacing between commit rows, aligning with the updated design language.  
- The new overlay classes must be rendered by corresponding components; otherwise the styles will have no effect.  
- High z‑indices may unintentionally cover unrelated UI elements if not scoped correctly.

### Risks & follow‑ups  
- Verify that the expanded commit list does not overflow the viewport on mobile devices.  
- Run smoke tests for the onboarding flow to confirm the new overlays appear and dismiss correctly.  
- Check that the new `.product-tour-*` and `.shortcuts-help-*` classes do not clash with existing global styles.  
- Ensure that the updated padding does not break any existing layout assumptions in the commit list component.
