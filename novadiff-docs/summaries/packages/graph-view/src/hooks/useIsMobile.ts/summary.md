### Overview
A new hook, `useIsMobile`, is added at `packages/graph-view/src/hooks/useIsMobile.ts`. It returns a boolean indicating whether the viewport width is below a configurable breakpoint (default 768 px).

### Key changes
- Import `useEffect` and `useState` from `react` (R1).  
- Define `DEFAULT_BREAKPOINT = 768` (R3).  
- Export `useIsMobile(breakpoint = DEFAULT_BREAKPOINT)` (R5).  
- Build media query `(max-width: ${breakpoint - 1}px)` (R6).  
- Initialize state with `useState<boolean>`; guard against SSR (`typeof window === "undefined"` returns false) (R7‑R9).  
- `useEffect` creates a `MediaQueryList`, updates state on change, and removes the listener on cleanup (R12‑R18).  
- Return the current `isMobile` state (R20‑R21).

### Impact
- SSR‑safe: returns `false` when `window` is undefined.  
- Single source of truth for breakpoint logic; default can be adjusted.  
- Minimal overhead: one event listener per hook instance.  
- Works in browsers supporting `matchMedia` and `addEventListener` on `MediaQueryList`.

### Risks & follow‑ups
- Verify `matchMedia` support in target browsers; fallback may be needed for legacy environments (unknown from the available diff/scan evidence).  
- Confirm cleanup correctly removes the listener to avoid memory leaks.  
- Test the hook in SSR contexts (e.g., Next.js) to ensure no crashes.  
- Ensure that changing the `breakpoint` prop updates the listener and state as expected.
