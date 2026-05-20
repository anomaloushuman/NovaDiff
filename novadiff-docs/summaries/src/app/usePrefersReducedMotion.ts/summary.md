### Overview  
A new hook `usePrefersReducedMotion` was added to **src/app/usePrefersReducedMotion.ts** (lines R1‑R19). It exposes a boolean that reflects the user’s “prefers‑reduced‑motion” media query, using the browser’s `matchMedia` API.

### Key changes  
- **Import** – `useEffect` and `useState` from React are imported (R1).  
- **Export** – `export function usePrefersReducedMotion(): boolean` is added (R3).  
- **State init** – `useState` is seeded with a function that checks `window.matchMedia("(prefers-reduced-motion: reduce)")` and falls back to `false` when `window` or `matchMedia` is unavailable (R4‑R7).  
- **Effect** – `useEffect` registers a `change` listener on the media query and updates state accordingly, cleaning up on unmount (R11‑R16).  
- **Return** – The hook returns the current `reduced` state (R18).

### Impact  
- **SSR safety** – The initial state guard (`typeof window === "undefined"`) prevents errors during server‑side rendering.  
- **Encapsulation** – Media‑query logic is isolated in a reusable hook, improving maintainability.  
- **Performance** – Only one event listener is attached per component instance.  
- **Compatibility** – Uses standard `matchMedia`; safe when `window` is absent.

### Risks & follow‑ups  
- Verify that the hook does not throw during SSR (the guard is present but should be tested).  
- Ensure `matchMedia` is supported in target browsers; consider a polyfill if needed.  
- Run unit tests to confirm initial state and change‑event updates behave as expected.  
- Confirm that the empty dependency array in `useEffect` is appropriate and does not miss updates if the media query changes before mount.
