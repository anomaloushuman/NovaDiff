### Overview
A new Vite configuration file `packages/graph-view/vite.config.demo.ts` (lines 1‑49) has been added to support a demo build of the graph view.

### Key changes
- **Imports** added:  
  - `defineConfig` from `vite` (R1)  
  - `react` from `@vitejs/plugin-react` (R2)  
  - `tailwindcss` from `@tailwindcss/vite` (R3)  
  - `path` from `path` (R4)  
- **Base path** set to `"/demo/"` (R7) to serve assets under `/demo/`.  
- **Aliases** map `@novadiff/graph-core/*` to compiled `dist/*.js` files (R11‑R13).  
- **Environment** variable `import.meta.env.VITE_DEMO_MODE` set to `"true"` (R18).  
- **Chunking** logic splits `node_modules` into `react-vendor`, `xyflow`, `graph-layout`, and `markdown` bundles (R24‑R41).  
- **Plugins** registered: `react()` and `tailwindcss()` (R48).

### Impact
- The demo build can resolve core modules via the new aliases.  
- `VITE_DEMO_MODE` flag is available to the application code.  
- Chunking may reduce bundle size for the demo, but the exact impact is unknown from the diff.

### Risks & follow‑ups
- Verify that the `path.resolve` aliases point to the correct build outputs; a mismatch will break module resolution.  
- Ensure the regexes in `manualChunks` cover all intended node_modules; missing patterns could lead to oversized bundles.  
- Test that the application consumes `VITE_DEMO_MODE` as expected.  
- Confirm that the `/demo/` base path does not conflict with production routes.
