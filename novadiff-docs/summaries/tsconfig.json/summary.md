### Overview  
A new `tsconfig.json` file (lines 1‑25) has been added to the repository. It configures TypeScript for the project with an ES2020 target, ESNext module style, and strict linting options.

### Key changes  
- **compilerOptions** (lines 2‑6):  
  - `target: "ES2020"`  
  - `module: "ESNext"`  
  - `useDefineForClassFields: true`  
  - `lib: ["ES2020", "DOM", "DOM.Iterable"]`  
- **Bundler mode** (lines 9‑13):  
  - `moduleResolution: "bundler"`  
  - `allowImportingTsExtensions: true`  
  - `resolveJsonModule: true`  
- **Strict type‑checking** (lines 18‑21):  
  - `strict: true`  
  - `noUnusedLocals: true`  
  - `noUnusedParameters: true`  
  - `noFallthroughCasesInSwitch: true`  
- **Build flags** (lines 7‑15):  
  - `noEmit: true`  
  - `isolatedModules: true`  
  - `jsx: "react-jsx"`  
- **Project inclusion** (line 23): includes `src`, `packages/graph-view/src/NovaDiffGraphExplorer.tsx`, and `packages/graph-view/src/index.ts`.  
- **Reference** (line 24): points to `tsconfig.node.json`.

### Impact  
- The compiler will target ES2020 and emit ESNext modules, affecting downstream bundling.  
- `noEmit: true` means the TypeScript compiler performs only type‑checking; emitted JavaScript must come from the bundler.  
- Bundler mode flags allow importing `.ts` files and JSON modules directly.  
- Strict flags may surface type errors that were previously ignored.

### Risks & follow‑ups  
- Verify that `tsconfig.node.json` exists and contains compatible overrides; missing it will break the build.  
- Run the nearest targeted tests and a smoke test for the graph‑view components to confirm type‑checking passes.  
- Ensure the build pipeline respects `noEmit: true`; adjust if it previously emitted JavaScript.  
- Check that the new strict flags do not introduce regressions in legacy code by running linting and unit tests.
