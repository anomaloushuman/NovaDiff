### Overview  
A new light‑mode media query was added to `src/components/CodeMapLoadingPreview.css` (lines 269‑371). It replaces the dark‑theme palette with lighter colors and adjusts gradients, shadows, and borders for the code‑map loading preview.

### Key changes  
- **Media query**: `@media (prefers-color-scheme: light)` (lines 269‑371).  
- `.code-map-loading-preview` background changed from `#04080e` to `#edf4fd`.  
- Gradient backgrounds for `__viewport::after`, `__stars`, `__horizon`, `__mesh`, and `__console` updated to use lighter accent colors (`#0da7d7`, `#00b9db`, `#edf4fd`).  
- Shadows and opacities adjusted: e.g., `__horizon` opacity set to `0.72`; `__mesh` box‑shadow reduced.  
- Text colors for `__title`, `__track-label`, `__track-pct`, and `__track-detail` changed to lighter hues (`#10233a`, `#12314a`, `#47647f`).  
- Special handling for macOS liquid‑glass hosts (lines 355‑371): hides backdrop plates/gradients and sets transparent backgrounds for the preview and its subcomponents.

### Impact  
- **Visual**: The loader preview now displays with a light‑mode palette; contrast ratios may differ from the dark theme.  
- **Testing**: Any tests that assert specific color values or background images will need updates to match the new light‑mode styles.  
- **Maintainability**: The new media query block keeps dark‑theme logic untouched while adding a dedicated light‑mode override.  
- **Runtime**: No JavaScript changes; purely CSS, so no impact on other components.

### Risks & follow‑ups  
- **Dark‑mode leakage**: Verify that the new styles do not affect dark‑theme contexts.  
- **Accessibility**: Run a WCAG audit to confirm that the new colors meet contrast requirements.  
- **Liquid‑glass interaction**: Ensure that the `html.app-liquid-glass` overrides do not unintentionally affect unrelated components.  
- **Test failures**: Update any snapshot or color‑assertion tests that reference the old dark‑theme values.
