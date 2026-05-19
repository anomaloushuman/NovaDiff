### Overview  
The Vite configuration was updated to add Tailwind CSS support, introduce module path aliases, refine server watch exclusions, and extend dependency pre‑bundling.

### Key changes  
- Added `import path from "node:path"` (R1) and `import tailwindcss from "@tailwindcss/vite"` (R4).  
- Declared `const repoRoot = path.resolve(__dirname)` (R6) for relative alias resolution.  
- Updated `plugins` to `[react(), tailwindcss()]` (R10), replacing the previous `[react()]` (removed at line 6).  
- Introduced `resolve.alias` mapping `@novadiff/graph-core` and `@novadiff/graph-view` to their source directories (R13‑18).  
- Expanded `server.watch.ignored` to exclude `**/electron/**`, `**/release/**`, `**/packages/graph-core/dist/**`, `**/novadiff-docs/**`, `**/.novadiff-graph/**`, `**/cli/target/**`, and the two `repoRoot` paths (R24‑35).  
- Added `optimizeDeps.include` with `@xyflow/react`, `zustand`, `d3-force`, `@dagrejs/dagre`, `graphology`, and `elkjs/lib/elk.bundled.js`, plus `needsInterop: ["elkjs"]` (R38‑48).

### Impact  
- Tailwind CSS plugin is now part of the dev and build pipeline.  
- Aliases provide direct imports from `packages/graph-core/src` and `packages/graph-view/src`.  
- Additional ignored patterns reduce the likelihood of full reloads triggered by generated artifacts.  
- Explicitly pre‑bundled dependencies may improve HMR and dev server startup times.

### Risks & follow‑ups  
- Verify that `repoRoot` resolves correctly on Windows; path separators may affect alias targets.  
- Ensure a compatible `tailwind.config.js` exists for the new plugin.  
- Confirm that the expanded `ignored` patterns do not suppress necessary reloads for dynamic content.  
- Run a full production build to check for duplicate bundles or runtime errors introduced by the new `optimizeDeps` entries.
