### Overview  
The Vite configuration now replaces the single `@novadiff/graph-core` alias with three granular aliases for the core package’s types, schema, and search modules.  
The change occurs in the `resolve.alias` section (lines 15‑26 of `vite.config.ts`).

### Key changes  
- **Removed** the old alias `@novadiff/graph-core` that pointed to `packages/graph-core/src`.  
- **Added**  
  - `@novadiff/graph-core/types` → `packages/graph-core/src/types.ts`  
  - `@novadiff/graph-core/schema` → `packages/graph-core/src/schema.ts`  
  - `@novadiff/graph-core/search` → `packages/graph-core/src/search.ts`  
- The `@novadiff/graph-view` alias remains unchanged.  
- No other configuration sections were modified.

### Impact  
- **Module resolution**: Imports that previously used `@novadiff/graph-core` must now target the specific sub‑modules (`types`, `schema`, `search`).  
- **Build correctness**: The new aliases point to individual source files, which is likely to reduce bundle size and avoid accidental exposure of internal files.  
- **Maintainability**: Explicit aliases clarify intent and make refactoring of the core package easier.  
- **Compatibility**: Existing code that imports `@novadiff/graph-core` will break unless updated; this change is a breaking API shift for consumers of the Vite config.

### Risks & follow‑ups  
- **Import regressions**: Verify that all internal imports now reference the new aliases; run `npm run lint` and `npm test` to catch unresolved imports.  
- **Build failures**: Ensure the TypeScript compiler resolves the new paths; run `npm run build` to confirm.  
- **Documentation**: Update any README or docs that mention the old alias.  
- **CI pipelines**: Confirm that the updated config does not affect server watch ignore patterns or dev server behavior.
