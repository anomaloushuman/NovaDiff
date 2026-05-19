### Overview
- A new package `@novadiff/graph-view` was added under `packages/graph-view`.  
- The added file `packages/graph-view/package.json` contains 47 new lines (R1‑47).  
- It declares the package name, marks it `private`, sets version `0.1.0`, and uses `"type": "module"`.

### Key changes
- **Exports** (lines 6‑9):  
  - `"."` → `./src/index.ts`  
  - `"./styles.css"` → `./src/index.css`  
- **Scripts** (lines 10‑16):  
  - `dev`, `build`, `build:demo`, `preview`, `test`, `test:watch` – all invoke Vite, TypeScript, or Vitest.  
- **Dependencies** (lines 18‑33): includes `@dagrejs/dagre`, `@novadiff/graph-core` (file:../graph-core), `@xyflow/react`, `d3-force`, `elkjs`, `graphology`, `graphology-communities-louvain`, `graphology-types`, `hast-util-to-jsx-runtime`, `prism-react-renderer`, `react`, `react-dom`, `react-markdown`, `zustand`.  
- **DevDependencies** (lines 35‑46): Tailwind, TypeScript, Vite, Vitest, and related plugins.

### Impact
- The monorepo build must now resolve and compile `graph-view`.  
- Tests for this package use Vitest; coverage is enabled via `@vitest/coverage-v8`.  
- The local reference `file:../graph-core` creates a tight coupling; changes to `graph-core` may affect this package.  
- Importing `@novadiff/graph-view` will expose the TS entry point and CSS file as defined in the exports.

### Risks & follow‑ups
- **Dependency resolution** – verify that `file:../graph-core` resolves in CI; missing symlinks could break installation.
