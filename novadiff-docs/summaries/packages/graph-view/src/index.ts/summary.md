### Overview
A new entry point file `packages/graph-view/src/index.ts` was added. It re‑exports the `NovaDiffGraphExplorer` component and its related types from `./NovaDiffGraphExplorer`.

### Key changes
- Exported component: `export { NovaDiffGraphExplorer } from "./NovaDiffGraphExplorer";` (lines 1‑1)
- Exported types: `export type { NovaDiffGraphExplorerProps, NovaDiffGraphDiffOverlay } from "./NovaDiffGraphExplorer";` (lines 2‑5)

### Impact
- Public API: Consumers can import `NovaDiffGraphExplorer`, `NovaDiffGraphExplorerProps`, and `NovaDiffGraphDiffOverlay` directly from the graph‑view package.
- Type safety: The type exports provide compile‑time checks and IDE autocompletion for the component’s props and overlay.
- Runtime: No functional changes; the file only re‑exports existing symbols.
- Build: The new file will be part of the TypeScript compilation and bundled output.

### Risks & follow‑ups
- Verify that the exported names do not collide with existing exports in the package.
- Update documentation (README, API docs) to reflect the new exports.
- Add tests that import the component via the new entry point to confirm the re‑export works.
- Confirm that bundlers correctly tree‑shake unused exports; no unintended side effects are expected.
