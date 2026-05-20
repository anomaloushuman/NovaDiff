### Overview  
A new TypeScript configuration file `packages/graph-view/tsconfig.app.json` was added (lines 1‑24). It defines compiler options and source inclusion for the Graph View application.

### Key changes  
- `compilerOptions` target **ES2020** with `module: "ESNext"` and `moduleResolution: "bundler"` (diff lines 2‑4).  
- Strict mode enabled (`strict: true`) and lint flags: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` (diff lines 17‑21).  
- `useDefineForClassFields: true`, `skipLibCheck: true`, and `jsx: "react-jsx"` (diff lines 5‑6, 15).  
- Incremental build info stored at `./node_modules/.tmp/tsconfig.app.tsBuildInfoFile` (`tsBuildInfoFile` line 3).  
- `noEmit: true` indicates this config is for type‑checking only (diff line 14).  
- Source files included via `"include": ["src"]` (diff line 23).

### Impact  
- The configuration enables stricter type‑checking for Graph View code.  
- `noEmit: true` means the file is not used for emitting JavaScript; a separate build config must handle bundling.  
- The presence of `noUncheckedSideEffectImports` suggests a recent TypeScript version is required, though the exact version compatibility is unknown from the diff.

### Risks & follow‑ups  
- Verify that build scripts (e.g., `tsc --project packages/graph-view/tsconfig.app.json`) reference this file.  
- Ensure the `./node_modules/.tmp/` directory is writable during CI to avoid build failures.  
- Confirm the repository’s TypeScript version supports all enabled flags, especially `noUncheckedSideEffectImports`.
