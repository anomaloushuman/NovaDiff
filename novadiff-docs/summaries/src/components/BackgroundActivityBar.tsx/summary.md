### Overview  
A new component `BackgroundActivityBar` is added to `src/components` (lines 15‑68). It renders a live status bar for background tasks, showing each task’s label, optional detail, elapsed time, and a progress bar that can be indeterminate.

### Key changes  
- **Imports** (lines 1‑3): `useEffect`, `useState` from React; `useBackgroundActivity` from the context; `usePrefersReducedMotion` for accessibility.  
- **Utility** (lines 5‑12): `formatElapsed(ms)` converts milliseconds to `Xs` or `Xm Ys`.  
- **State & effect** (lines 18‑26): `now` is updated every 500 ms via `setInterval`; the interval is cleared on unmount.  
- **Render logic** (lines 32‑66):  
  - Returns `null` if `activities.length === 0`.  
  - Maps `activities` to DOM nodes, using `activity.id` as key.  
  - Displays `activity.label`, optional `activity.detail`, and elapsed time from `formatElapsed(now - activity.startedAt)`.  
  - Shows a progress bar: if `activity.progress` is `null`, the bar is indeterminate (`is‑indeterminate`); otherwise it sets `width` to the rounded percentage.  
- **Accessibility** (lines 33‑35): `role="status"`, `aria-live="polite"`, `aria-atomic="false"`.  
- **Reduced motion** (line 44): adds `is‑animated` to the pulse element unless `reduced` is true.

### Impact  
- **UI**: Provides visual feedback for background operations.  
- **Performance**: The 500 ms interval is lightweight; renders only when activities change.  
- **Accessibility**: Live region and reduced‑motion handling improve inclusivity.  
- **Maintainability**: The component is self‑contained, with a clear utility function and minimal external dependencies.  
- **Compatibility**: Requires `useBackgroundActivity` to supply `id`, `label`, `detail`, `startedAt`, and optional `progress`.

### Risks & follow‑ups  
- **Memory leak**: The cleanup in `useEffect` clears the interval, but verify in edge cases.  
- **CSS dependencies**: Classes such as `background-activity-bar`, `is‑animated`, and `is‑indeterminate` must exist.  
- **Context contract**: Ensure `useBackgroundActivity` returns the expected shape; mismatches will break rendering.  
- **Usage**: The file is added but not yet imported elsewhere; add it to the app layout or test its presence in the component tree.
