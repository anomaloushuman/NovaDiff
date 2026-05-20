### Overview  
A new component `AnimatedOverlay` was added to `src/components/ui/AnimatedOverlay.tsx` (lines R1‑79). It implements a modal overlay that respects the user’s reduced‑motion preference.

### Key changes  
- **Imports**  
  - R1 added: `import { useEffect, useState } from "react";`  
  - R2 added: `import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";`  
- **Constant**  
  - R4 added: `const CLOSE_MS = 300;` – delay used when closing the overlay.  
- **Props interface** (`AnimatedOverlayProps`, R6‑13)  
  - `open: boolean`  
  - `onClose: () => void`  
  - `backdropClassName: string`  
  - `panelClassName: string`  
  - `labelledBy?: string`  
  - `children: React.ReactNode`  
- **Component logic** (`AnimatedOverlay`, R15‑79)  
  - State: `mounted` and `visible`.  
  - First `useEffect` syncs mounting/visibility with `open` and reduced‑motion settings, using `requestAnimationFrame` for the opening transition and `window.setTimeout` for the closing delay.  
  - Second `useEffect` adds a global `keydown` listener that calls `onClose` when the Escape key is pressed.  
  - Backdrop click handler triggers `onClose`.  
  - Renders a `div` with `role="dialog"`, `aria-modal="true"`, optional `aria-labelledby`, and CSS classes `ui-overlay`, `ui-overlay-panel`, plus motion states `is-open` or `is-closing`.

### Impact  
- **Correctness** – The component mounts only when `open` is true and unmounts after the closing delay, respecting reduced‑motion settings.  
- **Maintainability** – A clear `AnimatedOverlayProps` interface and self‑contained logic simplify future extensions.  
- **Performance** – Uses `requestAnimationFrame` for visibility changes and a 300 ms timeout for closing, reducing layout thrashing.  
- **Compatibility** – Relies on `window` and `document` APIs; may need SSR guards if used server‑side.  
- **Observability** – No side‑effects beyond event listeners; listeners are cleaned up on unmount.

### Risks & follow‑ups  
- Verify that `onClose` fires correctly on Escape key and backdrop click.  
- Ensure `usePrefersReducedMotion` disables animation when appropriate.  
- Test that the component unmounts cleanly after closing to avoid memory leaks.  
- Confirm that the referenced CSS classes (`ui-overlay`, `ui-overlay-panel`, `is-open`, `is-closing`) exist and produce the intended visual effect.
