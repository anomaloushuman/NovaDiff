### Overview  
A new `package.json` was added at `packages/graph-core/package.json` (diff range R1‑58).  
It defines a TypeScript‑based library with an ES‑module entry point and a detailed exports map.

### Key changes  
- **Metadata** – `name`, `version`, `type`, `main`, and `types` are set (lines 1‑6).  
- **Exports map** – explicit entries for `./search`, `./types`, `./schema`, and `./languages` (lines 7‑27).  
- **Scripts** – `build`, `catalog:generate`, and `test` commands are declared (lines 29‑33).  
- **DevDependencies** – TypeScript, Vitest, and coverage tooling (lines 34‑39).  
- **Runtime dependencies** – a suite of `tree-sitter-*` parsers, `web-tree-sitter`, `yaml`, and `zod` (lines 40‑56).  

### Impact  
- **Build** – `tsc` will emit `dist/index.js` and type declarations, enabling consumers to import the package as an ES module.  
- **Testing** – `vitest run` will execute unit tests; coverage tooling is configured.  
- **Dependency graph** – the added `tree-sitter-*` packages increase bundle size and may affect runtime performance.  
- **Export consistency** – the explicit `exports` field ensures consumers receive the correct entry points, reducing import errors.

### Risks & follow‑ups  
- **Build failures** – verify that `tsc` compiles without errors and that all `dist/*.d.ts` files are generated.  
- **Test coverage** – run `vitest` to confirm all tests pass; check coverage thresholds.  
- **Dependency conflicts** – ensure the new `tree-sitter` versions are compatible with existing tooling.  
- **Export mapping** – double‑check that the `exports` entries correctly point to the built files; missing paths could break imports.
