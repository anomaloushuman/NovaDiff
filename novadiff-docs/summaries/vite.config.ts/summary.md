### Overview  
A new `vite.config.ts` (lines 1‑49) bootstraps the NovaDiff dev server. It imports Vite helpers, React and Tailwind plugins, and sets up path resolution, aliases, server options, and dependency optimization.

### Key changes  
- **Imports**  
  - `import path from "node:path";` (R1)  
  - `import { defineConfig } from "vite";` (R2)  
  - `import react from "@vitejs/plugin-react";` (R3)  
  - `import tailwindcss from "@tailwindcss/vite";` (R4)  
- **Root resolution**  
  - `const repoRoot = path.resolve(__dirname);` (R6) – used for watch‑ignore paths.  
- **Export**  
  - `export default defineConfig(() => ({ … }))` (R9) – Vite configuration.  
- **Aliases**  
  - `@novadiff/graph-core` → `packages/graph-core/src` (R15)  
  - `@novadiff/graph-view` → `packages/graph-view/src` (R16)  
- **Server**  
  - `port: 1420`, `strictPort: true`, `host: "127.0.0.1"` (R20‑22)  
  - Extensive `watch.ignored` patterns (R26‑35) to avoid reloads on generated artifacts.  
- **OptimizeDeps**  
  - Pre‑bundles `@xyflow/react`, `zustand`, `d3-force`, `@dagrejs/dagre`, `graphology`, `elkjs/lib/elk.bundled.js` (R39‑46)  
  - Marks `elkjs` for interop (R47).

### Impact  
- **Developer experience** – `clearScreen: false` keeps console logs visible; `strictPort` prevents silent port fallback.  
- **Performance** – `optimizeDeps` speeds up dev builds by pre‑bundling heavy libraries.  
- **Observability** – Watch‑ignore list reduces unnecessary reloads, keeping the dev server responsive.

### Risks & follow‑ups  
- Verify that `repoRoot` resolves correctly on all CI environments; failing to do so may break ignored paths.  
- Ensure port 1420 is available; otherwise Vite will error due to `strictPort: true`.  
- Confirm that the alias paths match the actual package locations; mismatches will cause import failures.  
- Test that the `optimizeDeps` list covers all runtime dependencies; missing entries could lead to slower hot‑reloads.
