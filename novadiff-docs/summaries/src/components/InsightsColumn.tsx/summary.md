### Overview
`InsightsColumn` now accepts a `prefetchProgress` prop and renders a visual progress bar instead of a plain text status. The component’s layout has been tweaked: the summary panel uses a keyed `div` with an enter animation class, and the file‑summary section no longer wraps its content in a generic scroll container.

### Key changes
- **New prop**: `prefetchProgress?: { current: number; total: number } | null` added to `InsightsColumnProps` (line 28).  
- **Summary panel**: replaced `<div className="insights-scroll">` with `<div key="summary" className="insights-scroll insights-panel-enter">` (lines 106‑108).  
- **Prefetch status UI**: removed the plain `<p>` (line 189) and added a `<div className="insights-prefetch-status doc-state-enter">` containing a progress bar that shows either a determinate fill or an indeterminate track (lines 191‑212).  
- **File‑summary footnote**: the reserved‑path warning and chunk hint logic remain unchanged; only the prefetch status rendering changed.  
- **Minor refactor**: the `ChangedFilesTree` container now uses a keyed `div` with `insights-panel-enter` (lines 258‑261).

### Impact
- **UX**: Users now see a visual indicator of prefetch progress, improving feedback during large diff operations.  
- **Maintainability**: Adding the `prefetchProgress` prop centralizes progress handling; the component no longer relies on a global state for this UI.  
- **Performance**: The progress bar uses CSS transitions; no new heavy computations are introduced.  
- **Compatibility**: Existing callers must supply the new prop (or `null`) to avoid TypeScript errors; backward‑compatibility is preserved by making it optional.

### Risks & follow‑ups
- **Regression**: Verify that components consuming `InsightsColumn` still compile after the prop change; run the TypeScript build.  
- **UI consistency**: Ensure the new progress bar styles (`insights-prefetch-status`, `insights-prefetch-track`) are present in the CSS and that animations trigger correctly.  
- **Accessibility**: The progress bar currently lacks ARIA attributes; consider adding `role="progressbar"` and `aria-valuenow/aria-valuemin/aria-valuemax` for screen readers.  
- **Testing**: Add unit tests to confirm that `prefetchProgress` renders the correct fill percentage and that the indeterminate state appears when `total` is zero or `null`.
