### Overview  
A new React hook `usePrefersReducedMotion` was added in `src/app/usePrefersReducedMotion.ts`. It returns a boolean indicating whether the user prefers reduced motion and updates reactively.

### Key changes  
- New file `src/app/usePrefersReducedMotion.ts` (lines 1‑19 added).  
- Imports `useEffect` and `useState` from React (R1).  
- Exports `function usePrefersReducedMotion(): boolean` (R3).  
- Initializes state with `useState(() => { … })` (R4‑8).  
- SSR guard: `typeof window === "undefined" || !window.matchMedia` → `false` (R5‑6).  
- Initial value from `window.matchMedia("(prefers-reduced-motion: reduce)").matches` (R8).  
- `useEffect` adds a `"change"` listener on `mq` and updates state via `setReduced(mq.matches)` (R11‑15).  
- Cleanup removes the listener on unmount (R15‑16).  
- Hook returns the `reduced` state (R18‑19).

### Impact  
- Provides a reusable, SSR‑safe hook for reduced‑motion preference.  
- Adds a single event listener per mount; cleanup is handled.

### Risks & follow‑ups  
- Verify that the default `false` during SSR matches hydration expectations.  
- Ensure `matchMedia` and `"change"` events are supported in target browsers; consider polyfills if needed.  
- Confirm that `removeEventListener` is invoked correctly on unmount.
