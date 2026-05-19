### Overview  
A new `tsconfig.json` file was added at `packages/graph-core/tsconfig.json` (lines 1‑19). It defines the TypeScript build configuration for the `graph-core` package.

### Key changes  
- **File added**: `packages/graph-core/tsconfig.json` (R1‑19).  
- **Compiler options** (R2‑R6):  
  - `target: "ES2022"`  
  - `module: "ESNext"`  
  - `lib: ["ES2022"]`  
  - `moduleResolution: "bundler"`  
- **Strictness flags** (R7‑R10): `strict`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`.  
- **Output settings** (R15‑R16): `outDir: "dist"`, `rootDir: "src"`.  
- **Declarations & maps** (R12‑R14): `declaration`, `declarationMap`, `sourceMap`.  
- **Includes** (R18): `include: ["src"]`.

### Impact  
- The package now compiles independently, isolating its TypeScript settings from the workspace.  
- Modern JavaScript features are enabled (`ES2022` target, `ESNext` module).  
- Strict type‑checking and declaration generation may surface previously hidden type errors.  
- Compile time could increase due to stricter checks and map generation.

### Risks & follow‑ups  
- **Compatibility**: Verify that downstream consumers can handle `ES2022` output and `ESNext` modules.  
- **Type regressions**: Run the package’s unit tests and a quick smoke test to catch any new errors introduced by `strict: true`.  
- **Bundler behavior**: Ensure that `moduleResolution: "bundler"` works with the existing bundler configuration (e.g., Rollup, Webpack).  
- **Documentation**: Update any build‑related docs to reference the new `tsconfig.json`.
