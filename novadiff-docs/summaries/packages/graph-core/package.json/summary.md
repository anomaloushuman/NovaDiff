### Overview  
A new file `packages/graph-core/package.json` (added at line 1–58) introduces the `@novadiff/graph-core` npm package. The manifest declares ESM support (`"type":"module"`) and points to compiled outputs (`"main":"dist/index.js"`, `"types":"dist/index.d.ts"`).

### Key changes  
- **Package metadata** – `name`, `version`, `type`, `main`, `types` (lines 1–6).  
- **Exports map** – entries for `"./search"`, `"./types"`, `"./schema"`, `"./languages"` with corresponding `.d.ts` and `.js` paths (lines 7–27).  
- **Scripts** – `build` (`tsc`), `catalog:generate` (node script), `test` (`vitest run`) (lines 29–33).  
- **DevDependencies** – TypeScript `^5.7.0`, Vitest `^3.1.0`, coverage plugin, Node type definitions (lines 34–39).  
- **Dependencies** – `fuse.js`, `ignore`, a suite of `tree-sitter-*` parsers, `web-tree-sitter`, `yaml`, `zod` (lines 40–56).

### Impact  
- **Build & test** – Running `npm install`, `npm run build`, and `npm run test` is required to confirm compilation and unit tests (deterministic verification hint).  
- **ESM behavior** – The `type: module` flag may affect import syntax for consumers.  
- **Dependency footprint** – The added parsers and `web-tree-sitter` increase install size and potential bundle size.  
- **TypeScript integration** – Exported `.d.ts` files provide type definitions for consumers.

### Risks & follow‑ups  
- **Export correctness** – Unknown from the available diff/scan evidence; verify that each `"./<module>"` export resolves correctly (e.g., via `npm pack`).  
- **Test coverage** – Unknown; run `npm run test` and inspect coverage thresholds.  
- **Dependency conflicts** – Unknown; check compatibility of the new `tree-sitter-*` versions with other projects.  
- **Node version compatibility** – Unknown; ensure ESM configuration works on target Node LTS releases.
