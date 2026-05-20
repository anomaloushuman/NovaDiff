### Overview  
A new component `src/components/launch/TypewriterText.tsx` implements a typewriter animation that respects the user’s reduced‑motion preference.

### Key changes  
- **Imports** (R1‑R2): `useEffect`, `useRef`, `useState` from React and `usePrefersReducedMotion` from `../../app/usePrefersReducedMotion`.  
- **Props interface** (`TypewriterTextProps`, R4‑R15):  
  - `text: string` – required.  
  - Optional `active`, `persist`, `speed`, `delay`, `className`, `showCursor`, `onComplete`.  
  - `persist` defaults to `true`; `speed` defaults to `22 ms`; `delay` defaults to `0`; `showCursor` defaults to `true`.  
- **Component** (`TypewriterText`, R17‑R99):  
  - Uses refs (`onCompleteRef`, `completedRef`, `wasActiveRef`) to avoid stale closures.  
  - When `active` is false, resets visibility unless `persist` is true and the animation has finished.  
  - If the user prefers reduced motion (`reduced`), the full text is shown immediately and `onComplete` is called.  
  - Otherwise, a `setTimeout`/`setInterval` loop reveals characters at `speed` ms per character, clearing timers on cleanup.  
  - Renders a `<span>` containing the visible slice of `text` and, if typing is in progress, a cursor element (`typewriter-cursor`).

### Impact  
- Adds a self‑contained typewriter effect with optional persistence and completion callback.  
- Requires React 16.8+ for hooks and the `usePrefersReducedMotion` hook.  
- No global state or external dependencies beyond React.

### Risks & follow‑ups  
- Verify that `usePrefersReducedMotion` correctly detects system settings; test both reduced and normal modes.  
- Ensure cleanup logic (`cancelled`, `clearTimeout`, `clearInterval`) prevents leaks when `active` toggles rapidly.  
- Confirm that `persist` keeps the text visible after completion when `active` becomes false.  
- Test cursor rendering logic with `showCursor`, `active`, `reduced`, and `done` flags to avoid flicker.
