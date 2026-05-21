### Overview  
A new `src/components/DocumentationWorkspaceLinked.tsx` file introduces a set of utilities that bind the documentation workspace to the Code City graph. It adds a sync root component, a bootstrap helper, a custom hook `useLinkedCityState`, and two toolbar components.

### Key changes  
- **`InitialDocsFocus` interface** (lines 16‑22) defines optional props for initial focus state.  
- **`DocumentationWorkspaceSyncRoot`** (lines 24‑37) wraps children in `DocsViewSyncProvider` and injects `DocsFocusBootstrap`.  
- **`DocsFocusBootstrap`** (lines 39‑42) registers an external node with `useDocsViewSyncExternalNode`.  
- **`useLinkedCityState`** (lines 44‑174) computes filtered layout, building mappings, highlights, and exposes callbacks for graph/city selection and entry/exit.  
- **`CodeCityGraphToolbar`** (lines 176‑206) renders a toolbar that shows the current file context and an exit button.  
- **`DocsLinkToolbar`** (lines 208‑215) displays a hint that the city and graph stay linked.

### Impact  
- **Correctness**: The hook centralizes sync logic; any misuse of `sync` or missing context will surface at runtime.  
- **Maintainability**: New exports are self‑contained; future refactors can target this file without touching other modules.  
- **Performance**: Heavy `useMemo` chains (e.g., `filteredLayout`, `buildingByNode`) may add overhead; monitor rendering times when the graph payload is large.  
- **Compatibility**: As a new file, it does not break existing code but requires importing the new components where needed.

### Risks & follow‑ups  
- **Context availability**: Verify that `DocsViewSyncProvider` is rendered above any consumer of `useLinkedCityState`.  
- **Type safety**: Ensure `GraphPayload` and `CodeCityLayoutResult` types align with actual payloads; mismatches will cause runtime errors.  
- **Performance regression**: Benchmark `useLinkedCityState` with a large graph to confirm memoization thresholds are adequate.  
- **UI consistency**: Confirm that `CodeCityGraphToolbar` and `DocsLinkToolbar` integrate visually with existing toolbars and do not duplicate functionality.
