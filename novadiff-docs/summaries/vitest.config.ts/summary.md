### Overview  
A new file `vitest.config.ts` has been added. It defines a minimal Vitest configuration that targets Node‑environment tests.

### Key changes  
- **Import** (line 1): `import { defineConfig } from "vitest/config";` (R1 added).  
- **Export default** (lines 3‑8): `export default defineConfig({ … });` (R3 added).  
- **Test options** (R4‑R7):  
  - `environment: "node"` (R5 added).  
  - `include: ["tests/**/*.test.ts"]` (R6 added).  

### Impact  
- The configuration will cause Vitest to run all `*.test.ts` files under the `tests/` directory using a Node environment.  
- It is isolated from existing build or lint setups.  
- Running tests requires the `vitest` package (and its TypeScript support) to be present in `devDependencies`.

### Risks & follow‑ups  
- **Missing dependency**: Verify that `vitest` is listed in `devDependencies`; otherwise add it.  
- **Path resolution**: Ensure that test files match the glob pattern `tests/**/*.test.ts`; adjust if tests live elsewhere.  
- **Environment mismatch**: Tests that rely on browser APIs will fail under the Node environment; consider a separate config or test adjustments.  
- **Build pipeline**: Confirm that CI scripts invoke Vitest (e.g., `vitest run`) so the new config is used.
