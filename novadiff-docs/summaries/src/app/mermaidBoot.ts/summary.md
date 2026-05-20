### Overview  
`src/app/mermaidBoot.ts` (lines 1‑37) introduces a lazy‑initialisation helper for Mermaid.  
It detects the browser’s color‑scheme preference, caches the chosen theme, and exposes a public API to render Mermaid diagrams on a list of DOM nodes.

### Key changes  
- **`initTheme`** – module‑level cache (`"dark" | "default" | null`) to remember the last used theme (R1‑3).  
- **`currentMermaidTheme()`** – checks `window.matchMedia("(prefers-color-scheme: dark)")`; returns `"default"` when the user prefers light mode or when `window` is undefined (SSR) (R3‑11).  
- **`ensureMermaidInit()`** – asynchronously imports `mermaid`, calls `m.initialize` with `startOnLoad: false`, the detected theme, and other options, then updates `initTheme`. It exits early if the theme hasn’t changed (R14‑27).  
- **`runMermaidNodes(nodes)`** – public API that first ensures initialization, then imports `mermaid` again (to satisfy type‑checking) and runs `m.run({ nodes })`. It is a no‑op for an empty array (R30‑37).

### Impact  
- **Correctness** – caching prevents duplicate initialisation per theme.  
- **Performance** – lazy imports and early return on unchanged theme reduce startup cost.  
- **Dark‑mode support** – `currentMermaidTheme` automatically selects `"default"` or `"dark"` based on system preference.  
- **SSR safety** – checks for `window` existence, so the module can be imported in server‑side contexts without throwing.  
- **Observability** – no global side effects; initialisation is explicit via `ensureMermaidInit`.

### Risks & follow‑ups  
- **Race conditions** – concurrent calls to `ensureMermaidInit` could trigger multiple imports; verify that the caching logic is sufficient in high‑concurrency scenarios.  
- **Missing `mermaid` dependency** – dynamic import may fail if the package is not bundled; run a build test to confirm the import path resolves.  
- **Empty node handling** – `runMermaidNodes` silently returns for an empty array; ensure callers don’t rely on a promise resolution that indicates work was done.  
- **Theme mismatch** – if the user toggles the system theme after initialisation, Mermaid will not update automatically; consider adding a listener if dynamic updates are required.
