### Overview  
A new React component `DocMermaidMount` is added to `src/components/DocMermaidMount.tsx` (lines 1‑113). It renders Mermaid diagrams from a string definition, showing a loading skeleton, handling errors, and cancelling stale renders.

### Key changes  
- **Imports** (R1‑R2): `useEffect`, `useRef`, `useState` from `react`; `runMermaidNodes` from `../app/mermaidBoot`.  
- **RenderPhase type** (R4): `"idle" | "waiting" | "rendering" | "ready" | "error"`.  
- **Props interface** (R6‑R12): `definition: string`; optional `loading`, `loadingLabel`, `errorLabel`.  
- **Component** (R14‑R113):  
  - Uses `useRef` for host `<div>` and a generation counter (`renderGenRef`).  
  - `useEffect` on `[definition, loading]` handles empty definitions, shows skeleton, and triggers `runMermaidNodes([pre])` inside `requestAnimationFrame`.  
  - Cancels outdated renders via `cancelled` flag and generation check.  
  - UI renders a skeleton (`doc-mermaid-skeleton`), an error message (`doc-mermaid-error`), and a host `<div>` with classes reflecting the current phase.

### Impact  
- **Lifecycle safety**: Generation counter and cancellation guard prevent overlapping renders.  
- **User feedback**: Skeleton and error UI provide clear status.  
- **Styling hooks**: Class names (`doc-mermaid-mount`, `is-ready`, `is-busy`, `is-error`) allow CSS customization.

### Risks & follow‑ups  
- **Race conditions**: Verify rapid `definition` changes do not trigger overlapping renders; the generation counter mitigates this.  
- **CSS dependencies**: Ensure styles for the mentioned classes exist; missing styles could affect layout.  
- **SSR compatibility**: Component uses `useEffect`, so it runs only on the client; confirm surrounding app handles this.  
- **`runMermaidNodes` contract**: Import is used with `.then/.catch`; tests should cover success and failure paths.
