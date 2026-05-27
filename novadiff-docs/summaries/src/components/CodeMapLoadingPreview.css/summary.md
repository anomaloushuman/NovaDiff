### Overview  
A new stylesheet `src/components/CodeMapLoadingPreview.css` (267 lines added) introduces the visual scaffolding for the Code‑Map loading preview. The file defines the `.code-map-loading-preview` component and its sub‑elements (`__viewport`, `__stars`, `__horizon`, `__mesh`, `__beam`, `__console`, `__title`, `__tracks`, etc.).

### Key changes  
- **Toast‑bar suppression** – the rule  
  ```css
  body:has([data-code-map-loader]:not(.is-exiting)) .background-activity-bar {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
  }
  ```  
  (added at lines 1‑6) hides the global toast bar while the loader is active.  
- **Component styles** – the new CSS defines layout, colors, and animations for the loader UI.  
- **Animations** – keyframes `code‑map‑mesh‑sweep`, `code‑map‑track‑indeterminate`, `code‑map‑viewport‑exit`, and `code‑map‑console‑exit` drive the loader’s transitions.  
- **Reduced‑motion media query** – disables the mesh animation and shortens exit animations for users who prefer reduced motion (lines 258‑267).  
- **Modern CSS features** – the file uses `:has()`, `color‑mix`, radial gradients, and mask images.

### Impact  
- The loader now overlays the bottom HUD and suppresses duplicate toast bars, preventing visual duplication.  
- All styles are scoped to the `.code-map-loading-preview` namespace, reducing the risk of leaking into unrelated components.  
- The added CSS is lightweight; GPU‑accelerated animations are used where supported.

### Risks & follow‑ups  
- **Toast bar visibility** – it is unknown from the diff whether the suppression rule might hide essential notifications in edge cases.  
- **Browser support** – the use of `:has()` and `color‑mix` requires modern browsers; confirm compatibility in the target environment.  
- **Animation timing** – ensure the exit animations do not interfere with other page transitions.  
- **Test coverage** – add tests to verify that the CSS classes are applied and that the toast bar is hidden during loading.
