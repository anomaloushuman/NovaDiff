### Overview  
A new entry point `src/main.tsx` (lines R1‑R9) bootstraps the React app. It imports `StrictMode` from `react`, `createRoot` from `react-dom/client`, and the top‑level `App` component, then mounts `App` into the DOM element with id `root`.

### Key changes  
- New file `src/main.tsx` (R1‑R9).  
- Imports:  
  - `StrictMode` (R1).  
  - `createRoot` (R2).  
  - `App` (R3).  
- Calls `createRoot(document.getElementById("root") as HTMLElement).render(` (R5).  
- Wraps the tree in `<StrictMode>` (R6‑R8).  
- Renders `<App />` as the root component (R7).

### Impact  
- Provides a defined entry point; without an element `id="root"` the app will fail to mount.  
- Centralizes rendering logic, simplifying future changes to the mounting strategy.  
- Uses the modern `createRoot` API, the current recommended way to mount React apps.

### Risks & follow‑ups  
- If the HTML template lacks an element with `id="root"`, `document.getElementById("root")` returns `null`, causing a runtime error.  
- The type assertion `as HTMLElement` assumes the element exists; verify the DOM contains the expected node.  
- Ensure `react`, `react-dom`, and matching type definitions are installed and compatible with `createRoot`.
