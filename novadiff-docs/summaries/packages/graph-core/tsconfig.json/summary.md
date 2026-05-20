### Overview  
A new `tsconfig.json` file was added to `packages/graph-core` (lines 1‑19). It configures TypeScript to compile the package with modern ECMAScript features and strict type‑checking.

### Key changes  
- **File added**: `packages/graph-core/tsconfig.json` (lines 1‑19).  
- **Target & module**: `target: "ES2022"` and `module: "ESNext"` enable native ES2022 syntax and modern module handling.  
- **Library**: `lib: ["ES2022"]` limits globals to the ES2022 API set.  
- **Resolution**: `moduleResolution: "bundler"` aligns with the build system’s bundler strategy.  
- **Strictness**: `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true` enforce robust type safety.  
- **Output**: `outDir: "dist"`, `rootDir: "src"` set the build output structure.  
- **Declarations**: `declaration: true`, `declarationMap: true` generate `.d.ts` files for consumers.  
- **JSON support**: `resolveJsonModule: true` allows importing JSON modules.  
- **Source maps**: `sourceMap: true` aids debugging.  
- **Include**: `include: ["src"]` limits compilation to source files.

### Impact  
- **Build pipeline**: The new config will be used by `tsc` when compiling `graph-core`; unknown from the available diff/scan evidence whether the build script references it.  
- **Runtime compatibility**: unknown from the available diff/scan evidence.  
- **Type safety**: strict mode and declaration generation are enabled, which may surface type errors in existing code.  
- **Module resolution**: `moduleResolution` set to `bundler` may affect how external modules are resolved; verify that third‑party imports still resolve correctly.

### Risks & follow‑ups  
- **Build failures**: run `npm run build:graph-core` to confirm the new tsconfig compiles without errors.  
- **Test coverage**: execute the package’s unit tests to catch any runtime regressions due to the ES2022 target.  
- **Compatibility**: verify that downstream projects consuming `graph-core` can handle the new module format and ES2022 features.  
- **Documentation**: update any build or developer docs that reference the previous TypeScript configuration.
