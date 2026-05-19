### Overview
A new component, `TypewriterText`, is added at `src/components/launch/TypewriterText.tsx`. It renders a typewriter‑style animation with an optional cursor, reduced‑motion support, and a completion callback.

### Key changes
- **Imports**: `useEffect`, `useRef`, `useState` from React (lines 1‑2) and `usePrefersReducedMotion` from `../../app/usePrefersReducedMotion` (line 2).  
- **Props interface** (`TypewriterTextProps`, lines 4‑15): `text`, optional `active`, `persist`, `speed`, `delay`, `className`, `showCursor`, and `onComplete`.  
- **Component** (`export function TypewriterText`, lines 17‑99): sets defaults, tracks `visible` state, and uses refs for `onComplete`, completion status, and active state.  
- **Reduced‑motion handling** (lines 52‑56): if `reduced` is true, the full text is shown immediately and `onComplete` is called.  
- **Typing logic** (lines 59‑79): a `setTimeout` for `delay` starts a `setInterval` that increments `visible` by `speed` until the full text is displayed, then clears timers and triggers `onComplete`.  
- **Cleanup** (lines 81‑86): cancels timers and resets `wasActiveRef`.  
- **Render** (lines 91‑97): displays the current slice of text and, if `showCursor`, `active`, and not finished or reduced, shows a cursor element.

### Impact
- Introduces a reusable UI element; no existing API changes.  
- Adds a dependency on `usePrefersReducedMotion`; the hook must be exported and functional.  
- Adds hooks and timers; the performance impact is expected to be minimal.  
- Other components remain unaffected and can import `TypewriterText` directly.

### Risks & follow‑ups
- **Reduced‑motion detection**: verify that `usePrefersReducedMotion` correctly reads the user preference; otherwise the animation may always run.  
- **Callback firing**: confirm `onComplete` is invoked exactly once per full run; the ref logic should prevent duplicate calls.  
- **Active toggling**: when `active` becomes false, the component resets unless `persist` is true and the text has already completed.  
- **Cursor logic**: ensure cursor visibility respects `showCursor`, `active`, `reduced`, and completion state.
