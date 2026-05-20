### Overview
A new TypeScript configuration file has been added at `packages/graph-view/tsconfig.json`.  
The file contains an empty `"files"` array and a single reference to `./tsconfig.app.json` (lines 1‑4 of the diff).

### Key changes
- **File added**: `packages/graph-view/tsconfig.json`  
  ```json
  {
    "files": [],
    "references": [{ "path": "./tsconfig.app.json" }]
  }
  ```
- No other files were modified.

### Impact
- The file enables project references for the `graph-view` package, allowing isolated compilation.  
- With an empty `"files"` array, the compiler will include all files under the package root unless excluded elsewhere.  
- The reference to `tsconfig.app.json` introduces a dependency that must exist and be correctly configured; otherwise the build will fail.

### Risks & follow‑ups
- **Missing `tsconfig.app.json`**: Verify that the referenced file exists in `packages/graph-view`.  
- **Build failures**: Run `tsc -b packages/graph-view` to confirm the reference chain resolves.  
- **Duplicate references**: Ensure no other tsconfig files inadvertently reference `graph-view` in a conflicting way.  
- **Performance impact**: Monitor compile times; the empty `"files"` array could increase the number of files processed.
