### Overview  
A new stylesheet `src/components/ui/ui-transitions.css` (added lines R1‑120) introduces CSS‑only transition rules for overlays, panels, and view animations, with a media query for reduced‑motion users.

### Key changes  
- **Overlay** – `.ui-overlay` (lines 3‑6) starts with `opacity: 0` and a 0.28 s transition.  
  `.ui-overlay.is-open` (lines 8‑10) sets `opacity: 1`.  
  `.ui-overlay.is-closing` (lines 12‑15) fades to `opacity: 0` and disables pointer events.  
- **Panel** – `.ui-overlay-panel` (lines 17‑25) uses `transform`, `filter`, and a 0.32 s cubic‑bezier transition.  
  `.ui-overlay-panel.is-open` (lines 27‑31) restores full opacity, scale, and blur.  
  `.ui-overlay-panel.is-closing` (lines 33‑37) reduces opacity, shifts, and blurs.  
- **View animations** – `.ui-view-enter` (line 39) triggers `ui-view-enter` keyframes (lines 80‑90).  
  `.ui-view-fade` (line 43) triggers `ui-view-fade` keyframes (lines 93‑101).  
- **Tabs & panels** – `.insights-tab` (lines 63‑70) and `.insights-panel-enter` (line 76) add subtle transitions.  
- **Reduced‑motion** – media query (lines 104‑120) disables all animations and sets a 0.15 s opacity transition for users preferring reduced motion.

### Impact  
The changes are purely CSS; no JavaScript logic is altered. If the file is omitted from the bundle, the UI will remain static. The reduced‑motion media query respects user preferences.

### Risks & follow‑ups  
- **Build inclusion** – verify that `ui-transitions.css` is imported into the component bundle.  
- **Smoke test** – confirm overlay open/close and panel animations work as defined.  
- **Reduced‑motion test** – ensure animations are disabled when the media query matches.  
- **Name collisions** – check that keyframe names (`ui-view-enter`, `ui-view-fade`) do not clash with existing animations.
