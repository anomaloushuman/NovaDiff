### Overview
A new Vite config file `packages/graph-view/vite.config.demo.ts` (lines R1‑49) is added to bootstrap the demo build. It sets a base path, resolves core modules, injects a demo‑mode flag, and configures chunk splitting and plugins.

### Key changes
- **Imports** (R1‑R4):  
  ```ts
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";
  import path from "path";
  ```
- **Export** (R6): `export default defineConfig({ … })` with `base: "/demo/"` (R7).  
- **Module resolution** (R9‑R15): `resolve.alias` maps  
  `@novadiff/graph-core/schema` → `../core/dist/schema.js`,  
  `@novadiff/graph-core/search` → `../core/dist/search.js`,  
  `@novadiff/graph-core/types` → `../core/dist/types.js`.  
- **Environment flag** (R17‑R19): `define: { "import.meta.env.VITE_DEMO_MODE": JSON.stringify("true") }`.  
- **Chunking** (R21‑R44): `build.rollupOptions.output.manualChunks` splits React, XYFlow, graph‑layout, and markdown‑related dependencies into separate vendor bundles.  
- **Plugins** (R48): `plugins: [react(), tailwindcss()]`.

### Impact
- Core modules are resolved to the compiled `dist/*.js` files, enabling the demo to import them directly.  
- The `VITE_DEMO_MODE` flag is available in `import.meta.env`, allowing demo‑specific code paths.  
- Manual chunking creates distinct vendor bundles for React, XYFlow, graph‑layout, and markdown dependencies.

### Risks & follow‑ups
- The paths `../core/dist/*.js` must exist after the core build; missing files will break the demo.  
- The regexes in `manualChunks` must match all intended modules; incorrect matches could leave dependencies in the main bundle.  
- Run `vite build --config packages/graph-view/vite.config.demo.ts` to verify the base path and env flag.  
- Ensure the `react` and `tailwindcss` plugins load without warnings on all target platforms.
