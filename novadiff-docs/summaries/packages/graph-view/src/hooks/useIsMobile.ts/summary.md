### Overview  
A new hook `useIsMobile` is added at `packages/graph-view/src/hooks/useIsMobile.ts`. It returns a boolean indicating whether the viewport width is below a configurable breakpoint (default `768 px`).

### Key changes  
- Import `useEffect` and `useState` from `react` (line 1).  
- Define `DEFAULT_BREAKPOINT = 768` (line 3).  
- Exported function `useIsMobile(breakpoint = DEFAULT_BREAKPOINT): boolean` (line 5).  
- Media query string: ``(max-width: ${breakpoint - 1}px)`` (line 6).  
- Initial state lazily computed: returns `false` when `typeof window === "undefined"` (SSR) and otherwise `window.matchMedia(query).matches` (lines 7‑9).  
- `useEffect` attaches a `change` listener to update state and cleans up on unmount (lines 12‑18).  
- Hook returns the current `isMobile` flag (line 20).

### Impact  
- Centralizes breakpoint logic; components can import a single hook instead of duplicating media‑query code.  
- SSR‑safe: returns `false` on server, preventing hydration mismatches.  
- Minimal overhead: one `matchMedia` listener per component instance.

### Risks & follow‑ups  
- **SSR usage**: Components should not depend on the hook’s value during the initial server render.  
- **Listener cleanup**: Verify `removeEventListener` is called correctly; run unit tests for unmount scenarios.  
- **Custom breakpoint**: Ensure passing a different breakpoint updates the query and listener.  
- **Browser support**: `addEventListener` on `MediaQueryList` may not exist in older browsers; consider a polyfill if needed.
