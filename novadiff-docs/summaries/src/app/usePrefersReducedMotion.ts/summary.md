### Overview
A new hook, `usePrefersReducedMotion`, is added to **src/app/usePrefersReducedMotion.ts** (lines 1‑19). It exposes the user’s reduced‑motion preference in a type‑safe, SSR‑friendly way.

### Key changes
- **Imports** `useEffect` and `useState` from `react` (line 1).  
- **Exports** `function usePrefersReducedMotion(): boolean` (line 3).  
- **State initialization** uses `useState(() => { … })` (lines 4‑8), guarding against `window` being undefined and falling back to `false`.  
- **Media query** `window.matchMedia("(prefers-reduced-motion: reduce)")` determines the initial value.  
- **Effect** sets up a `change` event listener on the media query (lines 11‑15) and cleans it up on unmount.  
- **Return** the current `reduced` boolean (line 18).

### Impact
- Provides a reusable, lightweight hook for accessibility‑aware components.  
- Adds negligible runtime overhead; the listener is added once per component instance.  
- SSR safe: defaults to `false` when `window` is undefined, preventing hydration mismatches.  
- No new external dependencies; relies on native `matchMedia`.

### Risks & follow‑ups
- Verify that components using this hook render consistently on server and client to avoid hydration warnings.  
- Test in browsers lacking `matchMedia` (e.g., IE11) to confirm the fallback to `false` behaves correctly.  
- Ensure the `change` listener cleanup runs properly to avoid memory leaks in long‑lived components.  
- Add unit tests covering initial state, listener updates, and the SSR guard.
