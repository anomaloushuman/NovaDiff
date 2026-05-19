### Overview
A new TypeScript declaration file was added to the graph‑view package.

### Key changes
- File `packages/graph-view/src/vite-env.d.ts` added.  
- Contains a single line: `/// <reference types="vite/client" />`.

### Impact
- The reference imports Vite client types, making Vite‑specific globals (e.g., `import.meta.env`) available to the TypeScript compiler.  
- No runtime code is added; the file is only used at compile time.  
- The package now requires the `vite` types (or the `vite` package) to be present in `devDependencies`.

### Risks & follow‑ups
- Ensure `vite` or `@types/vite` is listed in `devDependencies`; otherwise the reference will fail.  
- Verify that the file is included in the TypeScript `include` array; otherwise the reference is ignored.  
- Run `npm run lint`, `npm test`, and `npm run build` to confirm no new type errors or build failures.  
- Monitor CI for any unexpected type‑checking regressions.
