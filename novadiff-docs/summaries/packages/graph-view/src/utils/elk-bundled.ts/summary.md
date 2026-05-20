### Overview  
New file `packages/graph-view/src/utils/elk-bundled.ts` (lines 1‑35) adds an ESM‑compatible shim for the ELK layout engine’s UMD bundle, enabling lazy loading in Vite/Electron contexts.

### Key changes  
- **Exported types**  
  - `ElkLayoutInstance` (lines 3‑5) – interface with `layout(graph: unknown): Promise<unknown>`.  
  - `ElkConstructor` (line 7) – constructor type returning `ElkLayoutInstance`.  
- **`resolveElkConstructor`** (lines 9‑14) checks `mod.default` or `mod.ELK`; throws if neither is a function.  
- **`loadElkConstructor`** (lines 19‑25) performs a single dynamic import of `"elkjs/lib/elk.bundled.js"` and caches the resulting promise (`ctorPromise`).  
- **`loadElk`** (lines 30‑35) creates an `ElkLayoutInstance` by invoking the cached constructor and caches the instance promise (`instancePromise`).

### Impact  
- **Correctness**: `resolveElkConstructor` validates the constructor before use, preventing silent failures.  
- **Performance**: Caching (`ctorPromise`, `instancePromise`) avoids repeated bundle loads, reducing startup time and memory usage.  
- **Maintainability**: Centralizes ELK loading logic; other modules can `import { loadElk }` without handling UMD quirks.  
- **Compatibility**: The file is a pure TS module with no side effects, suitable for both browser and Node environments.

### Risks & follow‑ups  
- Runtime failure if `"elkjs/lib/elk.bundled.js"` is missing or corrupted; callers should handle promise rejection.  
- Verify that the caching logic correctly prevents multiple imports across the application.  
- Ensure that the returned `ElkLayoutInstance` satisfies downstream expectations.  
- Test dynamic import behavior in Electron’s preload script.
