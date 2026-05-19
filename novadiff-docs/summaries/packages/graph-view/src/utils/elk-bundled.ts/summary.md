### Overview  
A new file `packages/graph-view/src/utils/elk-bundled.ts` (R1‑R35) adds a Vite/Electron‑friendly shim for the ELK layout engine. It declares typed constructors, resolves the UMD bundle’s export, and lazily loads the engine and its instance.

### Key changes  
- **Type definitions** (`R3‑R7`):  
  - `ElkLayoutInstance` with a `layout(graph: unknown): Promise<unknown>` method.  
  - `ElkConstructor` as `new () => ElkLayoutInstance`.  
- **`resolveElkConstructor`** (`R9‑R14`): inspects the imported module for `default` or `ELK`; throws an error if neither is a function.  
- **`loadElkConstructor`** (`R19‑R25`): imports `elkjs/lib/elk.bundled.js` once, caches the constructor promise, and returns it.  
- **`loadElk`** (`R30‑R35`): creates a single `ElkLayoutInstance` from the cached constructor, caching the instance promise.  
- **Shim comment** (`R1`): explains the need for this file in Vite/Electron contexts where the UMD bundle lacks an ESM default export.

### Impact  
- **Correctness**: ensures the ELK constructor is resolved from the UMD bundle, throwing a clear error if missing.  
- **Performance**: caches both constructor and instance promises, avoiding repeated imports or instantiations.  
- **Maintainability**: centralizes ELK loading logic; other modules can import `loadElk` without bundler quirks.  
- **Compatibility**: works with Vite/Electron setups that otherwise cannot import the UMD bundle as an ES module.

### Risks & follow‑ups  
- **Import path resolution**: verify that `elkjs/lib/elk.bundled.js` resolves correctly in all target environments.  
- **Error handling**: ensure the thrown error message is surfaced to users when the bundle is missing or malformed.  
- **Caching correctness**: test that repeated calls to `loadElk` return the same instance and that promise rejection propagates properly.  
- **Type safety**: run TypeScript linting to confirm that the new types integrate cleanly with existing graph‑view code.
