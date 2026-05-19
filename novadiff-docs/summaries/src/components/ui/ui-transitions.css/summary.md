### Overview  
A new file, `src/components/ui/ui-transitions.css` (lines 1‑120), adds CSS for overlay, panel, and view transitions. The file introduces a reduced‑motion media query to disable animations when the user prefers less motion.

### Key changes  
- **Overlay** – `.ui-overlay` (lines 3‑6) starts with `opacity: 0` and a 0.28 s transition.  
  - `.ui-overlay.is-open` (lines 8‑10) sets `opacity: 1`.  
  - `.ui-overlay.is-closing` (lines 12‑15) returns to `opacity: 0` and disables pointer events.  
- **Panel** – `.ui-overlay-panel` (lines 17‑25) defines initial opacity, transform, blur, and a 0.32 s transition.  
  - `.ui-overlay-panel.is-open` (lines 27‑31) restores full opacity, no transform, and no blur.  
  - `.ui-overlay-panel.is-closing` (lines 33‑37) reverts to reduced opacity, a slight translateY, and a 3 px blur.  
- **View animations** – `.ui-view-enter` (lines 39‑41) and `.ui-view-fade` (lines 43‑45) trigger keyframes `ui-view-enter` (lines 80‑90) and `ui-view-fade` (lines 93‑101).  
- **Reduced‑motion** – media query (lines 104‑120) removes animations, sets a minimal opacity transition, and ensures open states keep full opacity.  
- **Workspace helpers** – `.workspace-stage` (lines 47‑54) and `.workspace-stage-inner` (lines 56‑61) provide flex containers for the overlay structure.

### Impact  
- **UI behavior** – New transitions animate overlay panels and view entries.  
- **Accessibility** – Reduced‑motion handling is added; existing components are unaffected.  
- **Performance** – Animations use `transform` and `filter`; impact on GPU usage is unknown from the diff.  
- **Maintainability** – All new classes are prefixed with `.ui-`, reducing collision risk.

### Risks & follow‑ups  
- Verify that `.ui-overlay` and `.ui-overlay-panel` do not clash with any pre‑existing overlay implementations.  
- Run smoke tests for overlay open/close flows to confirm opacity and pointer‑event logic.  
- Test reduced‑motion preference across browsers to ensure animations are correctly disabled.  
- Check that the `filter: blur` transitions do not cause layout thrashing or visual glitches on older browsers.
