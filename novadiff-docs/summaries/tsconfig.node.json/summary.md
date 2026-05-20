### Overview  
A new `tsconfig.node.json` file (lines 1‑11) has been added. It configures TypeScript for a Node‑environment build that targets the Vite/Vitest configuration files.

### Key changes  
- **File added**: `tsconfig.node.json` (lines 1‑11).  
- **Compiler options** (cited lines R1‑R6):  
  - `composite: true` – enables incremental builds.  
  - `skipLibCheck: true` – skips type checking of declaration files.  
  - `module: "ESNext"` and `moduleResolution: "bundler"` – emit ESNext modules and resolve imports using the bundler algorithm.  
  - `allowSyntheticDefaultImports: true` – permits default imports from modules without a default export.  
  - `types: ["node"]` – includes Node.js type definitions.  
- **Include**: only `vite.config.ts` and `vitest.config.ts` are compiled under this config.

### Impact  
- The config applies to the Vite/Vitest config files, ensuring they compile against Node types.  
- `composite: true` allows TypeScript to reuse previous outputs, speeding up subsequent builds.  
- `skipLibCheck: true` reduces noise from third‑party declaration files, but may hide subtle type mismatches.  
- `moduleResolution: "bundler"` changes how imports are resolved compared to classic Node resolution.

### Risks & follow‑ups  
- Verify that the new `tsconfig.node.json` does not conflict with the root `tsconfig.json` or other project‑specific configs.  
- Run the Vite/Vitest build pipeline to confirm that `moduleResolution: "bundler"` correctly resolves all imports.  
- Check that `skipLibCheck: true` does not mask critical type errors in the config files.  
- Confirm that incremental builds (`composite: true`) work as expected in CI environments.
