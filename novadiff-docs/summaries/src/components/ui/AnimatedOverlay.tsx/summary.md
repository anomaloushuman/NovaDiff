### Overview  
A new UI overlay component, `AnimatedOverlay`, is added in **src/components/ui/AnimatedOverlay.tsx** (lines 1‑79). It provides animated show/hide behavior, respects reduced‑motion preferences, and handles keyboard and backdrop interactions.

### Key changes  
- **Imports** – `useEffect`, `useState` from React (R1) and a custom `usePrefersReducedMotion` hook (R2).  
- **Constant** – `CLOSE_MS = 300` (R4).  
- **Props interface** – `AnimatedOverlayProps` (R6‑R13) exposes `open`, `onClose`, `backdropClassName`, `panelClassName`, optional `labelledBy`, and `children`.  
- **Component** – exported at R15.  
  - State: `mounted` and `visible` (R24‑R25).  
  - First `useEffect` (R27‑R43) mounts/unmounts the overlay, triggers visibility, and schedules a close delay (`CLOSE_MS` or 0 for reduced motion).  
  - Second `useEffect` (R45‑R56) listens for the Escape key to call `onClose`.  
- **Render** – returns `null` when not mounted (R58‑R60). Otherwise renders a dialog with classes `ui-overlay`, `ui-overlay-panel`, and dynamic `is-open`/`is-closing` (R62‑R78). Backdrop click triggers `onClose` (R70‑R74).

### Impact  
- **Accessibility** – dialog role, `aria-modal`, and optional `aria-labelledby`.  
- **Animation** – double `requestAnimationFrame` sequence (R34‑R36) for smooth transitions; reduced‑motion path skips animation.  
- **Centralization** – animation logic is contained in one component, simplifying future adjustments.  
- **No breaking changes** – existing files are untouched; the new component is fully controlled via props.

### Risks & follow‑ups  
- The component imports `usePrefersReducedMotion`; ensure this hook exists and returns a boolean.  
- CSS classes `ui-overlay`, `ui-overlay-panel`, `is-open`, and `is-closing` must be defined; otherwise visual behavior will be missing.  
- Verify that `onClose` fires on Escape key and backdrop click; missing event listeners could leave the overlay open.  
- The double `requestAnimationFrame` call (R34‑R36) may cause layout thrashing on very old browsers; test across target environments.
