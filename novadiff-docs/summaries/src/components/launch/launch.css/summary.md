### Overview  
A new file `src/components/launch/launch.css` (531 lines, R1‑531) was added. It defines a TRON‑style launch sequence with many animations, gradients, and a reduced‑motion fallback.

### Key changes  
- **New classes**: `.launch-boot`, `.launch-boot-grid`, `.launch-boot-scan`, `.launch-boot-frame`, `.launch-boot-logo-ring`, `.launch-boot-continue`, `.launch-boot-line-placeholder`, `.launch-boot-copy`, `.launch-boot-progress`, `.launch-boot-corners span`, `.typewriter-cursor`, and several `.app-shell` panel visibility rules.  
- **Keyframe animations**: `launch-continue-in`, `launch-grid-in`, `launch-scan-sweep`, `launch-frame-in`, `launch-logo-pulse`, `typewriter-blink`, `launch-fly-left/right/up/down`, `launch-sheen`, `launch-brand-in`, `launch-chip-in`.  
- **Reduced‑motion media query** (`@media (prefers-reduced-motion: reduce)`) disables animations and sets opacity for non‑launched panels.  
- **Sidebar launch animations** for `.sidebar-feature`, `.sidebar-section`, and `.sidebar-user` with staggered delays.

### Impact  
- Adds CSS for the launch UI; size unknown from the diff.  
- Uses `color-mix`, radial gradients, and multiple animations, which may increase GPU load during launch.  
- No runtime behavior changes—only styling.

### Risks & follow‑ups  
- **Import**: Verify that `launch.css` is imported in the launch component or global stylesheet; otherwise the UI will not appear.  
- **Animation correctness**: Run smoke tests to confirm keyframes trigger and panels fade as intended.  
- **Reduced‑motion**: Ensure users with `prefers-reduced-motion` see the static fallback and that no animations bleed into other components.  
- **Browser support**: `color-mix` and `in` syntax require modern browsers; test on Safari/Edge and consider fallbacks if needed.
