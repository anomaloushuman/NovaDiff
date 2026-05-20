### Overview  
A new component `BackgroundActivityBar` is added at `src/components/BackgroundActivityBar.tsx` (lines 1‑68). It displays a live status bar for background activities, showing elapsed time and progress, and respects the user’s reduced‑motion preference.

### Key changes  
- **Imports** – `useEffect`, `useState` from React; `useBackgroundActivity` from `../app/BackgroundActivityContext`; `usePrefersReducedMotion` from `../app/usePrefersReducedMotion` (lines 1‑3).  
- **Utility** – `formatElapsed(ms)` converts milliseconds to a human‑readable string (lines 5‑12).  
- **State & effect** – `now` state is updated every 500 ms while activities exist; the interval is cleared on cleanup (lines 18‑26).  
- **Rendering** – For each activity, the component shows `label`, optional `detail`, elapsed time, and a progress bar that is indeterminate when `progress` is `null` (lines 32‑63).  
- **Accessibility** – Wrapper has `role="status"`, `aria-live="polite"`, `aria-atomic="false"`; each item uses `aria-hidden` appropriately.  
- **Reduced motion** – Pulsing animation is disabled when `reduced` is true (line 44).

### Impact  
- The component renders only when `activities.length > 0`, avoiding unnecessary DOM updates.  
- The 500 ms interval runs only while activities are present, limiting overhead.  
- `formatElapsed` is isolated, easing future formatting changes.  
- The status bar is announced via an ARIA live region, improving screen‑reader feedback.

### Risks & follow‑ups  
- Verify that `useBackgroundActivity` provides the expected `activities` shape; missing fields could break rendering.  
- Ensure CSS classes (`background-activity-bar`, `background-activity-pulse`, etc.) exist to avoid visual regressions.  
- Confirm that the interval cleanup works correctly when the component unmounts or activities clear.  
- Add unit tests for `formatElapsed` and the component’s rendering logic to guard against future refactors.
