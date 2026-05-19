### Overview  
A new React component `DocMermaidMount` is added in **src/components/DocMermaidMount.tsx** (lines 1‑113). It renders Mermaid diagrams from a string definition and provides a loading skeleton, error handling, and a ready state that toggles visibility of the rendered SVG.

### Key changes  
- **Imports** – added `useEffect`, `useRef`, `useState` from `react` (R1) and `runMermaidNodes` from `../app/mermaidBoot` (R2).  
- **Types** – declared `RenderPhase` union (`idle | waiting | rendering | ready | error`) (R4) and `DocMermaidMountProps` interface (R6‑R12) with `definition`, optional `loading`, `loadingLabel`, and `errorLabel`.  
- **Component logic** –  
  - Uses `useRef` for the host `<div>` and a generation counter (`renderGenRef`) (R20‑R23).  
  - Manages `phase` state (`idle`, `waiting`, `rendering`, `ready`, `error`) (R22).  
  - `useEffect` (R24‑R81) creates a `<pre class="mermaid">`, calls `runMermaidNodes`, updates `phase`, and cancels stale renders via a `cancelled` flag and generation check.  
  - Rendering defers to `requestAnimationFrame` (R71‑R76) to ensure layout stability.  
  - UI shows a skeleton while loading or rendering, an error message on failure, and the host div with conditional classes (`is-ready`, `is-busy`, `is-error`) (R83‑R111).  
- **Accessibility** – skeleton has `aria-busy="true"` and `aria-live="polite"`; host div gets `aria-hidden` when busy (R96‑R110).

### Impact  
- Centralizes Mermaid rendering logic, making future updates to `runMermaidNodes` or CSS easier.  
- Uses a generation counter to guard against race conditions when `definition` changes rapidly.  
- Defers rendering with `requestAnimationFrame`, reducing layout thrashing.

### Risks & follow‑ups  
- Verify that `runMermaidNodes` correctly processes the `<pre>` element and that Mermaid’s CSS is loaded.  
- Ensure CSS classes (`doc-mermaid-mount`, `doc-mermaid-skeleton`, etc.) exist and are scoped to avoid clashes.  
- Test cancellation logic by rapidly changing `definition` to confirm no stray SVGs or memory leaks.  
- Confirm correct phase transitions when `loading` is toggled mid‑render.
