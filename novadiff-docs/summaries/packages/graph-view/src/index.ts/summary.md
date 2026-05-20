### Overview  
A new entry point `packages/graph-view/src/index.ts` has been added.  
The file re‑exports the `NovaDiffGraphExplorer` component and its related types from `./NovaDiffGraphExplorer`.

### Key changes  
- **File added:** `packages/graph-view/src/index.ts` (lines R1‑R5).  
- **Exports added:**  
  ```ts
  export { NovaDiffGraphExplorer } from "./NovaDiffGraphExplorer";
  export type {
    NovaDiffGraphExplorerProps,
    NovaDiffGraphDiffOverlay,
  } from "./NovaDiffGraphExplorer";
  ```
- No other files were modified.

### Impact  
- Provides a public API surface for the graph view; consumers can import `NovaDiffGraphExplorer`, `NovaDiffGraphExplorerProps`, and `NovaDiffGraphDiffOverlay` directly from the package.  
- The new file must be included in the TypeScript compilation (e.g., via `tsconfig.json`) and referenced in the package’s `exports` field if conditional exports are used.  
- No runtime behavior of existing modules is altered; the change is purely an API addition.  
- Documentation should be updated to reflect the new exports.

### Risks & follow‑ups  
- Verify that `packages/graph-view/package.json` lists the new file in its `exports` or `main` field.  
- Run the test suite to confirm that importing `NovaDiffGraphExplorer` and its types works without type errors.  
- Ensure that the added types do not shadow existing symbols and that consumers can reference them without conflict.
